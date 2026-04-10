import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useGetCommunityByIdQuery,
  useJoinCommunityMutation,
} from "@/state/api/communityApi";
import { addJoinedCommunity } from "@/state/slice/authSlice";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import type { Post } from "@/state/types/postTypes";
import { toast } from "sonner";

interface PostSidebarProps {
  post: Post;
}

const PostSidebar = ({ post }: PostSidebarProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const { data: communityDetails } = useGetCommunityByIdQuery(
    post.community_id,
  );

  const joinedIds = useAppSelector(
    (state: RootState) => state.auth.joinedCommunityIds,
  );
  const isMember = joinedIds.includes(post.community_id);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });
  const dateSource = communityDetails?.created_at
    ? new Date(communityDetails.created_at)
    : new Date();
  const createdDate = format(dateSource, "do MMMM yyyy");

  const handleJoin = async () => {
    try {
      await joinCommunity(post.community_id).unwrap();
      toast.success("Successfully joined the community");
      dispatch(addJoinedCommunity(post.community_id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Community Card */}
      <div className="rounded-xl border-2 border-orange-200 p-5 shadow-sm space-y-2">
        <div
          className="flex items-center gap-3 mb-4 cursor-pointer"
          onClick={() =>
            navigate(`/dashboard/communities/${post.community_id}`)
          }
        >
          <img
            src={communityDetails?.banner_url || "/community.png"}
            alt="Community Banner"
            className="h-12 w-12 object-cover rounded-md"
          />
          <div>
            <h3 className="font-bold text-foreground hover:underline">
              pr/{communityDetails?.slug}
            </h3>
            <p className="text-xs text-muted-foreground">Community</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Created by: {communityDetails?.community_creator}
          </p>
          <p className="text-xs text-slate-500">Created: {createdDate}</p>
          <p className="text-xs text-slate-500">
            Members: {communityDetails?.member_count}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {communityDetails?.description}
        </p>

        {!isMember ? (
          <Button
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Join Community
          </Button>
        ) : (
          <Button variant="outline" className="w-full rounded-full" disabled>
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            You&apos;re already a member
          </Button>
        )}
      </div>

      {/* Post Stats */}
      <div className="rounded-xl border border-orange-300 p-5 shadow-sm">
        <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
          Post Stats
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Upvotes</span>
            <span className="font-medium">{post.votes_count || 0}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comments</span>
            <span className="font-medium">{post.comment_count || 0}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Views</span>
            <span className="font-medium">{post.view_count || 0}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Posted</span>
            <span className="font-medium">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSidebar;
