// components/post/PostContent.tsx
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetCommunityByIdQuery,
  useJoinCommunityMutation,
} from "@/state/api/communityApi";
import { addJoinedCommunity } from "@/state/slice/authSlice";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import type { Post } from "@/state/types/postTypes";

interface PostContentProps {
  post: Post;
}

const PostContent = ({ post }: PostContentProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const { data: communityDetails, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery(post.community_id);

  const joinedIds = useAppSelector(
    (state: RootState) => state.auth.joinedCommunityIds,
  );
  const isMember = joinedIds.includes(post.community_id);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await joinCommunity(post.community_id).unwrap();
      dispatch(addJoinedCommunity(post.community_id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <article className="bg-orange-200/50 rounded-xl border border-orange-300 overflow-hidden">
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={communityDetails?.banner_url}
              alt="Community Banner"
              className="h-12 w-12 object-cover rounded-md"
            />
            <div>
              <button
                onClick={() =>
                  navigate(`/dashboard/communities/${post.community_id}`)
                }
                className="text-sm font-bold hover:underline text-foreground"
              >
                pr/{communityDetails?.slug}
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Posted by {post.author}</span>
                <span>•</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>

          {!isMember && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white hover:bg-gray-100 border-gray-300"
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
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight mb-4 text-foreground">
          {post.title}
        </h1>

        {/* Status badge */}
        {post.status && post.status !== "published" && (
          <Badge variant="secondary" className="mb-4">
            {post.status}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </div>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-6 mb-6">
          <div className="relative rounded-lg overflow-hidden bg-white shadow-sm">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full max-h-[500px] object-contain"
            />
          </div>
        </div>
      )}
    </article>
  );
};

export default PostContent;
