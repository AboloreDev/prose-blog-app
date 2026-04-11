import Header from "@/components/code/Header";
import React from "react";
import ProfileHeader from "./components/ProfileHeader";
import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { useParams } from "react-router-dom";
import {
  clearViewedUser,
  setActiveTab,
  setViewedUser,
} from "@/state/slice/profileSlice";
import { Loader2, ServerCrashIcon } from "lucide-react";
import { useGetUserPostsQuery } from "@/state/api/postsApi";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs from "./components/ProfileTabs";
import ProfilePosts from "./components/ProfilrPosts";
import EditPostsSheet from "../posts/EditPostsSheet";
import DeletePostModal from "../posts/DeletePostModal";
import EditProfileSheet from "./components/EditProfileSheet";
import { useGetUserProfileQuery } from "@/state/api/userApi";

const Profile = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state: RootState) => state.auth.user);
  const activeTab = useAppSelector(
    (state: RootState) => state.profile.activeTab,
  );
  const searchQuery = useAppSelector((state) => state.global.searchQuery);

  // if no id in URL → own profile
  const profileId = id ? Number(id) : (currentUser?.id ?? 0);
  const isOwnProfile = profileId === currentUser?.id;

  const { data, isLoading, isError } = useGetUserProfileQuery(
    { id: profileId },
    {
      skip: !profileId,
    },
  );

  const { data: postsData } = useGetUserPostsQuery(
    {
      page: 1,
      page_size: 1,
      query: searchQuery,
      order_by: "DESC",
      user_id: profileId,
    },
    { skip: !profileId },
  );

  React.useEffect(() => {
    // @ts-expect-error "<>"
    if (data?.user) dispatch(setViewedUser(data.user));
    return () => {
      dispatch(clearViewedUser());
      dispatch(setActiveTab("posts"));
    };
  }, [data, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <ServerCrashIcon className="h-10 w-10 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Failed to load profile.</p>
      </div>
    );
  }

  const { user } = data;

  return (
    <section className="h-screen overflow-y-auto flex flex-col">
      <Header
        title={isOwnProfile ? "My Profile" : `${user?.username}'s Profile`}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {/*  @ts-expect-error "<>" */}
          <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
          <ProfileStats
            userId={user.id}
            postCount={postsData?.MetaData?.total_records ?? 0}
          />

          <div className="rounded-xl overflow-hidden">
            {/*  @ts-expect-error "<>" */}
            <ProfileTabs isOwnProfile={isOwnProfile} />
            <div className="p-4">
              {activeTab === "comments" ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  Comments tab coming soon
                </div>
              ) : (
                <ProfilePosts user={user} />
              )}
            </div>
          </div>
        </div>
      </main>

      <EditPostsSheet />
      <DeletePostModal />
      {/*  @ts-expect-error "<>" */}
      <EditProfileSheet user={user} />
    </section>
  );
};

export default Profile;
