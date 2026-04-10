import { formatDistanceToNow } from "date-fns";
import { Calendar, Loader2, UserCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch } from "@/state/redux";
import { setIsEditSheetOpen } from "@/state/slice/profileSlice";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useIsFollowingQuery,
} from "@/state/api/profileApi";
import type { UserProfile } from "@/state/types/profileTypes";

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile: boolean;
}

const ProfileHeader = ({ user, isOwnProfile }: ProfileHeaderProps) => {
  const dispatch = useAppDispatch();
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] =
    useUnfollowUserMutation();

  const { data: followingData } = useIsFollowingQuery({ id: user.id });

  const isFollowingUser = followingData?.isFollowing ?? false;
  const initials = user.username?.slice(0, 2).toUpperCase() ?? "?";

  const joinedDate = formatDistanceToNow(new Date(user.created_at), {
    addSuffix: true,
  });

  const handleFollowToggle = async () => {
    try {
      if (isFollowingUser) {
        await unfollowUser(user.id).unwrap();
      } else {
        await followUser(user.id).unwrap();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6  rounded-xl">
      {/* Avatar */}
      <Avatar className="h-20 w-20 shrink-0">
        <AvatarImage src={user.profile?.avatar_url} alt={user.username} />
        <AvatarFallback className="text-2xl font-bold bg-orange-100 text-orange-600">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-bold truncate">{user.username}</h1>
          <Badge variant="secondary" className="text-xs">
            {user.profile?.karma ?? 0} karma
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-1">{user.email}</p>

        {user.profile?.bio && (
          <p className="text-sm text-foreground/80 mb-2">{user.profile.bio}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Joined {joinedDate}</span>
        </div>
      </div>

      {/* Action button */}
      <div className="shrink-0">
        {isOwnProfile ? (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full bg-white border-0 p-2"
            onClick={() => dispatch(setIsEditSheetOpen(true))}
          >
            Edit Profile
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full gap-2 border-0 bg-white"
            variant={isFollowingUser ? "outline" : "default"}
            disabled={isFollowing || isUnfollowing}
            onClick={handleFollowToggle}
          >
            {isFollowing || isUnfollowing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isFollowingUser ? (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
