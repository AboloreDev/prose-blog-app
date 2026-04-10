import { Loader2, ServerCrash, Inbox } from "lucide-react";
import {
  useGetAllPostsQuery,
  useGetUserPostsQuery,
} from "@/state/api/postsApi";
import { useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import UserPostCard from "../../posts/UserPostsCard";
import type { User } from "@/state/types/authTypes";

interface ProfilePostsProps {
  user: User;
}

const ProfilePosts = ({ user }: ProfilePostsProps) => {
  const activeTab = useAppSelector(
    (state: RootState) => state.profile.activeTab,
  );
  const searchQuery = useAppSelector(
    (state: RootState) => state.global.searchQuery,
  );
  const currentUser = useAppSelector((state: RootState) => state.auth.user);

  const isOwnProfile = user.id === currentUser?.id;

  // own profile → use getUserPosts (JWT based)
  const {
    data: ownPosts,
    isLoading: ownLoading,
    isError: ownError,
  } = useGetUserPostsQuery(
    {
      page: 1,
      page_size: 20,
      query: searchQuery,
      order_by: "DESC",
      user_id: 0,
    },
    { skip: activeTab !== "posts" || !isOwnProfile },
  );

  // other user → use getAllPosts filtered by user_id
  const {
    data: otherPosts,
    isLoading: otherLoading,
    isError: otherError,
  } = useGetAllPostsQuery(
    {
      page: 1,
      page_size: 20,
      query: searchQuery,
      order_by: "",
      user_id: user.id,
    },
    { skip: activeTab !== "posts" || isOwnProfile },
  );

  // @ts-expect-error "<>"
  const posts = isOwnProfile ? ownPosts?.UserPosts : otherPosts?.Posts;
  const isLoading = isOwnProfile ? ownLoading : otherLoading;
  const isError = isOwnProfile ? ownError : otherError;

  if (activeTab === "comments") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Inbox className="h-8 w-8 text-muted-foreground opacity-20" />
        <p className="text-sm text-muted-foreground">Comments coming soon.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <ServerCrash className="h-8 w-8 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Failed to load posts.</p>
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Inbox className="h-8 w-8 text-muted-foreground opacity-20" />
        <p className="text-sm text-muted-foreground">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post: any) => (
        <UserPostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default ProfilePosts;
