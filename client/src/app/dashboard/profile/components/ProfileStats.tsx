// components/profile/ProfileStats.tsx
import { useAppDispatch } from "@/state/redux";
import {
  setIsFollowersSheetOpen,
  setIsFollowingSheetOpen,
} from "@/state/slice/profileSlice";
import { useGetFollowCountQuery } from "@/state/api/profileApi";

interface ProfileStatsProps {
  userId: number;
  postCount: number;
}

const ProfileStats = ({ userId, postCount }: ProfileStatsProps) => {
  const dispatch = useAppDispatch();
  const { data: followCount } = useGetFollowCountQuery(userId);

  const stats = [
    {
      label: "Posts",
      value: postCount,
      onClick: undefined,
    },
    {
      label: "Followers",
      value: followCount?.followerCount ?? 0,
      onClick: () => dispatch(setIsFollowersSheetOpen(true)),
    },
    {
      label: "Following",
      value: followCount?.followingCount ?? 0,
      onClick: () => dispatch(setIsFollowingSheetOpen(true)),
    },
  ];

  return (
    <div className="grid grid-cols-3 rounded-xl overflow-hidden">
      {stats.map((stat, i) => (
        <button
          key={stat.label}
          onClick={stat.onClick}
          disabled={!stat.onClick}
          className={`
                        flex flex-col items-center py-4 gap-1
                        ${stat.onClick ? "hover:bg-muted cursor-pointer" : "cursor-default"}
                        ${i !== stats.length - 1 ? "" : ""}
                        transition-colors
                    `}
        >
          <span className="text-xl font-bold">{stat.value}</span>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ProfileStats;
