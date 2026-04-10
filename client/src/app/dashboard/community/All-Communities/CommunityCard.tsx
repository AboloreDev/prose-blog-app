import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Community } from "@/state/types/communityTypes";
import { useJoinCommunityMutation } from "@/state/api/communityApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/state/redux";
import { useGetUserProfileQuery } from "@/state/api/userApi";

interface CommunityCardProps {
  community: Community;
}

export const CommunityCard = ({ community }: CommunityCardProps) => {
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [joinCommunity, { isLoading }] = useJoinCommunityMutation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: userProfile } = useGetUserProfileQuery(
    { id: user?.id ?? 0 },
    { skip: !user?.id },
  );
  const isMember = userProfile?.communities.some((c) => c.id === community.id);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await joinCommunity(community.id).unwrap();
      toast.success(`Joined ${community.name}`);
    } catch (error) {
      toast.error(`Failed to join ${community.name}`);
    }
    setJoined((prev) => !prev);
  };

  return (
    <div
      onClick={() => navigate(`/dashboard/communities/${community.id}`)}
      className="group bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer overflow-hidden"
    >
      {/* Banner */}
      <div className="relative h-20 bg-gradient-to-br from-orange-300 via-orange-400 to-amber-400 overflow-hidden">
        {community.banner_url ? (
          <img
            src={community.banner_url}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img src="/community.png" />
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="relative -mt-6 mb-3 flex items-end justify-between">
          <div className="h-12 w-12 rounded-xl border-4 border-white shadow-sm bg-orange-100 overflow-hidden flex items-center justify-center shrink-0">
            {community.banner_url ? (
              <img
                src={community.banner_url || "/community.png"}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-orange-400">
                {community.name[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleJoin}
            disabled={isLoading}
            className={`rounded-full text-xs px-4 h-8 transition-all ${
              joined
                ? "bg-orange-100 text-orange-600 hover:bg-red-50 hover:text-red-500 border border-orange-200"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : joined || isMember ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Joined
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Join
              </span>
            )}
          </Button>
        </div>

        <p className="font-bold text-gray-900 text-sm leading-tight truncate">
          {community.name}
        </p>
        <p className="text-xs text-orange-500 mb-2">pr/{community.slug}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {community.description}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{community.member_count.toLocaleString()} members</span>
          </div>
          <p className="text-xs text-muted-foreground">
            by {community.community_creator}
          </p>
        </div>
      </div>
    </div>
  );
};
