import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  SquareArrowDown,
  SquareArrowUp,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useVoteCommentMutation } from "@/state/api/commentsApi";
import { useAppDispatch } from "@/state/redux";

import CommentInput from "./CommentInput";
import { useGetNestedCommentsQuery } from "@/state/api/commentsApi";
import type { Comment } from "@/state/types/commentTypes";
import { setReplyingTo, updateCommentVote } from "@/state/slice/commentSlice";

interface CommentCardProps {
  comment: Comment;
  postId: number;
}

const CommentCard = ({ comment, postId }: CommentCardProps) => {
  const dispatch = useAppDispatch();
  const [voteComment] = useVoteCommentMutation();
  const [localVotes, setLocalVotes] = useState(comment.comment_vote_count);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const { data: replies, isLoading: repliesLoading } =
    useGetNestedCommentsQuery(
      { postId: comment.id, page_size: 10 },
      { skip: !showReplies },
    );

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });

  const initials = comment.author?.slice(0, 2).toUpperCase() ?? "?";

  const handleVote = async (type: "up" | "down") => {
    try {
      let newCount = localVotes;
      let newVote: "up" | "down" | null = type;

      if (userVote === type) {
        newCount = type === "up" ? localVotes - 1 : localVotes + 1;
        newVote = null;
      } else if (userVote === null) {
        newCount = type === "up" ? localVotes + 1 : localVotes - 1;
      } else {
        newCount = type === "up" ? localVotes + 2 : localVotes - 2;
      }

      setLocalVotes(newCount);
      setUserVote(newVote);
      dispatch(
        updateCommentVote({
          commentId: comment.id,
          newCount,
          userVote: newVote,
        }),
      );
      await voteComment({ id: comment.id, vote_type: type });
    } catch {
      setLocalVotes(comment.comment_vote_count);
      setUserVote(null);
    }
  };

  const handleReplyClick = () => {
    setShowReplyInput(!showReplyInput);
    dispatch(setReplyingTo(showReplyInput ? null : comment.id));
  };

  return (
    <div className="flex gap-3">
      {/* Thread line */}
      <div className="flex flex-col items-center">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        {(comment.reply_count > 0 || showReplyInput) && (
          <div className="w-0.5 bg-border flex-1 mt-1" />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-3">
        {/* Author + time */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{comment.author}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Body */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-2">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Votes */}
          <div className="flex items-center gap-0.5 bg-white rounded-full px-4 py-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-full ${userVote === "up" ? "text-orange-500" : "text-muted-foreground"}`}
              onClick={() => handleVote("up")}
            >
              <SquareArrowUp className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium min-w-4 text-center">
              {localVotes}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-full ${userVote === "down" ? "text-blue-500" : "text-muted-foreground"}`}
              onClick={() => handleVote("down")}
            >
              <SquareArrowDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Reply */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground"
            onClick={handleReplyClick}
          >
            <MessageSquare className="h-3 w-3" />
            Reply
          </Button>

          {/* Show replies */}
          {comment.reply_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-muted-foreground"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {comment.reply_count}{" "}
              {comment.reply_count === 1 ? "reply" : "replies"}
            </Button>
          )}
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div className="mt-3">
            <CommentInput
              postId={postId}
              parentId={comment.id}
              placeholder={`Reply to ${comment.author}...`}
              onSuccess={() => {
                setShowReplyInput(false);
                setShowReplies(true);
              }}
            />
          </div>
        )}

        {/* Nested replies */}
        {showReplies && (
          <div className="mt-3 space-y-3">
            {repliesLoading && (
              <p className="text-xs text-muted-foreground">
                Loading replies...
              </p>
            )}
            {replies?.Comments.map((reply) => (
              <CommentCard key={reply.id} comment={reply} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentCard;
