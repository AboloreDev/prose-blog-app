import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Share2,
  MoreHorizontal,
  Eye,
  Loader2,
  SquareArrowUp,
  SquareArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVotePostMutation } from "@/state/api/postsApi";
import {
  useGetCommunityByIdQuery,
  useJoinCommunityMutation,
} from "@/state/api/communityApi";
import { addJoinedCommunity } from "@/state/slice/authSlice";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import type { Post } from "@/state/types/postTypes";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [votePost] = useVotePostMutation();
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const [localVotes, setLocalVotes] = useState(post.votes_count);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const { data: communityDetails } = useGetCommunityByIdQuery(
    post.community_id,
  );

  const joinedIds = useAppSelector(
    (state: RootState) => state.auth.joinedCommunityIds,
  );
  const isMember = joinedIds.includes(post.community_id);

  const handleVote = async (type: "up" | "down") => {
    try {
      if (userVote === type) {
        setLocalVotes(type === "up" ? localVotes - 1 : localVotes + 1);
        setUserVote(null);
      } else if (userVote === null) {
        setLocalVotes(type === "up" ? localVotes + 1 : localVotes - 1);
        setUserVote(type);
      } else {
        setLocalVotes(type === "up" ? localVotes + 2 : localVotes - 2);
        setUserVote(type);
      }
      await votePost({ id: post.id, vote_type: type });
    } catch {
      setLocalVotes(post.votes_count);
      setUserVote(null);
    }
  };

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await joinCommunity(post.community_id).unwrap();
      toast.success("Successfully joined the community");
      dispatch(addJoinedCommunity(post.community_id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      `${window.location.origin}/dashboard/feeds/${post.id}`,
    );
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className="bg-orange-200 rounded-lg p-4 hover:border-foreground/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/dashboard/feeds/${post.id}`)}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <img
            src={communityDetails?.banner_url || "/community.png"}
            alt="Community Banner"
            className="h-6 w-6 object-cover rounded-md"
          />
          <button
            className="text-sm cursor-pointer hover:underline font-bold"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/communities/${post.community_id}`);
            }}
          >
            pr/{communityDetails?.slug}
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <span
            className="text-xs text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/profile/${post.user_id}`);
            }}
          >
            by {post.author}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Join button */}
          {!isMember && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs rounded-full px-3 bg-white hover:bg-gray-200"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Join"
              )}
            </Button>
          )}

          {/* Three dots */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-md h-7 w-7 hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={"z-50 bg-white border-none w-52 p-2 lato-regular"}
            >
              <DropdownMenuItem
                onClick={(e) => e.stopPropagation()}
                className={"cursor-pointer"}
              >
                Save
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.stopPropagation()}
                className={"cursor-pointer"}
              >
                Hide
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug mb-2">{post.title}</h3>

      {/* Body + Image */}
      <div className="flex flex-col gap-3 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {post.body}
        </p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-20 h-16 object-cover rounded-md shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Actions */}
      <div
        className="flex mt-4 items-center gap-3 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Votes */}
        <div className="flex items-center gap-0.5 rounded-full px-1 bg-white">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-full ${userVote === "up" ? "text-orange-500" : ""}`}
            onClick={() => handleVote("up")}
          >
            <SquareArrowUp className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium min-w-6 text-center">
            {localVotes}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-full ${userVote === "down" ? "text-blue-500" : ""}`}
            onClick={() => handleVote("down")}
          >
            <SquareArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Comments */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-full gap-1.5 text-xs bg-white"
          onClick={() => navigate(`/dashboard/feeds/${post.id}`)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {post.comment_count}
        </Button>

        {/* Views */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-full gap-1.5 text-xs"
        >
          <Eye className="h-3.5 w-3.5" />
          {post.view_count}
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-full gap-1.5 text-xs"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>

        {/* Status badge */}
        {post.status && post.status !== "published" && (
          <Badge variant="outline" className="text-xs h-5 ml-auto">
            {post.status}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PostCard;
