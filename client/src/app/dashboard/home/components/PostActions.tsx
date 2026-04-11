// components/post/PostActions.tsx
import { useState } from "react";
import {
  SquareArrowUp,
  SquareArrowDown,
  MessageSquare,
  Share2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotePostMutation } from "@/state/api/postsApi";

import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import type { Post } from "@/state/types/postTypes";
import { updatePostVote } from "@/state/slice/postSlice";

interface PostActionsProps {
  post: Post;
  onCommentClick?: () => void;
}

const PostActions = ({ post, onCommentClick }: PostActionsProps) => {
  const dispatch = useAppDispatch();
  const [votePost] = useVotePostMutation();
  const [copied, setCopied] = useState(false);

  const localVoteCount = useAppSelector(
    (state: RootState) => state.posts.localVoteCount,
  );
  const userVote = useAppSelector((state: RootState) => state.posts.userVote);

  const handleVote = async (type: "up" | "down") => {
    try {
      let newCount = localVoteCount;
      let newVote: "up" | "down" | null = type;

      if (userVote === type) {
        newCount = type === "up" ? localVoteCount - 1 : localVoteCount + 1;
        newVote = null;
      } else if (userVote === null) {
        newCount = type === "up" ? localVoteCount + 1 : localVoteCount - 1;
      } else {
        newCount = type === "up" ? localVoteCount + 2 : localVoteCount - 2;
      }

      dispatch(updatePostVote({ newCount, userVote: newVote }));
      await votePost({ id: post.id, vote_type: type });
    } catch {
      dispatch(
        updatePostVote({
          newCount: post.votes_count,
          userVote: null,
        }),
      );
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/posts/${post.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 py-4 bg-orange-300/30 border-t border-orange-300/50">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {/* Vote Buttons */}
          <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full ${
                userVote === "up"
                  ? "text-orange-600 bg-orange-50"
                  : "text-muted-foreground"
              }`}
              onClick={() => handleVote("up")}
            >
              <SquareArrowUp className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold min-w-[2ch] text-center">
              {localVoteCount || post.votes_count}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full ${
                userVote === "down"
                  ? "text-blue-600 bg-blue-50"
                  : "text-muted-foreground"
              }`}
              onClick={() => handleVote("down")}
            >
              <SquareArrowDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Comments */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-gray-50 gap-2 px-4 shadow-sm"
            onClick={onCommentClick}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">
              {post.comment_count || 0} Comments
            </span>
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-2 px-4 shadow-sm"
            onClick={handleShare}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span className="font-medium">{copied ? "Copied!" : "Share"}</span>
          </Button>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          <span>{post.view_count || 0} views</span>
        </div>
      </div>
    </div>
  );
};

export default PostActions;
