import { useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  useGetCommunityByIdQuery,
  useGetCommunityPostsQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
} from "@/state/api/communityApi";
import Header from "@/components/code/Header";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ServerCrash,
  Users,
  Globe,
  Lock,
  CalendarDays,
  PenLine,
  Compass,
  Plus,
} from "lucide-react";
import { openSheet } from "@/state/slice/postSlice";
import PostCard from "../../home/components/PostCards";
import { formatDate } from "date-fns";
import { CreatePostSheet } from "../../home/components/create/CreatePostSheet";
import { useAppSelector, type RootState } from "@/state/redux";
import { useGetUserProfileQuery } from "@/state/api/userApi";
import { toast } from "sonner";

const SingleCommunityDetails = () => {
  const { id } = useParams();
  const communityId = Number(id);
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [joinCommunity, { isLoading: joinLoading }] =
    useJoinCommunityMutation();
  const [leaveCommunity, { isLoading: leaveLoading }] =
    useLeaveCommunityMutation();

  const {
    data: communityDetails,
    isLoading: communityLoading,
    isError: communityError,
  } = useGetCommunityByIdQuery(communityId);

  const {
    data: postsData,
    isLoading: postsLoading,
    isError: postsError,
    isFetching: postsFetching,
  } = useGetCommunityPostsQuery({ page, page_size: 10, id: communityId });

  // @ts-expect-error "<>"
  const posts = postsData?.CommunityPosts ?? [];
  const postsMeta = postsData?.MetaData ?? null;

  const { user } = useAppSelector((state: RootState) => state.auth);

  const { data: userProfile } = useGetUserProfileQuery(
    { id: user?.id ?? 0 },
    { skip: !user?.id },
  );

  const isMember = userProfile?.communities.some((c) => c.id === communityId);

  const handleCreatePost = () => {
    if (!isMember) {
      toast("Join the community first to create a post 👋", {
        action: {
          label: "Join",
          onClick: handleJoin,
        },
      });
      return;
    }
    dispatch(openSheet({ tab: "text", communityId }));
  };

  const handleJoin = async () => {
    try {
      if (isMember) {
        await leaveCommunity(communityId).unwrap();
        toast.success(`Left ${communityDetails?.name}`);
      } else {
        await joinCommunity(communityId).unwrap();
        toast.success(`Joined ${communityDetails?.name}`);
      }
    } catch {
      toast.error(
        isMember
          ? `Failed to leave ${communityDetails?.name}`
          : `Failed to join ${communityDetails?.name}`,
      );
    }
  };

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-orange-50/40 lato-regular">
        <Header title="Community" subTitle="Loading..." />
        <div className="flex items-center justify-center py-32 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          <p className="text-sm text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  if (communityError || !communityDetails) {
    return (
      <div className="min-h-screen bg-orange-50/40 lato-regular">
        <Header title="Community" subTitle="Something went wrong" />
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <ServerCrash className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Failed to load community.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-orange-50/40 lato-regular">
      <Header
        title={communityDetails.name}
        subTitle={`pr/${communityDetails.slug}`}
      />

      <main>
        <div className="relative h-40 bg-gradient-to-br from-orange-300 via-orange-400 to-amber-400 overflow-hidden px-6 py-4">
          {communityDetails.banner_url && (
            <img
              src={communityDetails.banner_url ?? ""}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between -mt-8 mb-6">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl border-4 z-50 border-white shadow-md bg-orange-100 overflow-hidden flex items-center justify-center shrink-0">
                {communityDetails.banner_url ? (
                  <img
                    src={communityDetails.banner_url}
                    alt={communityDetails.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-orange-400">
                    {communityDetails.name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">
                    {communityDetails.name}
                  </h1>
                  {communityDetails.visibility && (
                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      {communityDetails.visibility === "private" ? (
                        <>
                          <Lock className="h-3 w-3" /> Private
                        </>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Public
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-orange-500">
                  pr/{communityDetails.slug}
                </p>
              </div>
            </div>

            <Button
              onClick={handleJoin}
              disabled={joinLoading || leaveLoading}
              className={`rounded-full px-6 transition-all ${
                isMember
                  ? "bg-orange-100 text-orange-600 hover:bg-red-50 hover:text-red-500 border border-orange-200"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
              }`}
            >
              {isMember ? "Joined" : "Join Community"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 pb-12">
            <div className="space-y-4">
              {/* Create post bar */}
              <button
                onClick={handleCreatePost}
                className="w-full flex items-center gap-3 bg-white rounded-2xl border border-orange-100 px-4 py-3 shadow-sm hover:border-orange-300 hover:shadow-md transition-all group"
              >
                <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <PenLine className="h-4 w-4 text-orange-400" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-gray-600 transition-colors">
                  {isMember
                    ? `Create a post in pr/${communityDetails.slug}...`
                    : "Join to start posting in this community..."}
                </span>
                <div className="ml-auto">
                  <Plus className="h-4 w-4 text-orange-400" />
                </div>
              </button>

              {/* Posts loading */}
              {postsLoading && (
                <div className="flex items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                  <p className="text-sm text-muted-foreground">
                    Loading posts...
                  </p>
                </div>
              )}

              {/* Posts error */}
              {postsError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <ServerCrash className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load posts.
                  </p>
                </div>
              )}

              {/* Empty posts */}
              {!postsLoading && !postsError && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <Compass className="h-7 w-7 text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    No posts yet
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Be the first to post in {communityDetails.name}
                  </p>
                  <Button
                    onClick={handleCreatePost}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 text-sm"
                  >
                    Create first post
                  </Button>
                </div>
              )}

              {/* Posts feed */}
              {!postsLoading && !postsError && posts.length > 0 && (
                <div
                  className={`space-y-4 transition-opacity duration-200 ${postsFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}
                >
                  {posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!postsLoading && !postsError && postsMeta && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-orange-200 hover:bg-orange-50"
                    disabled={page === 1 || postsFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {postsFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "← Previous"
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {postsMeta.current_page} of {postsMeta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-orange-200 hover:bg-orange-50"
                    disabled={page === postsMeta.last_page || postsFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {postsFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Next →"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4 lg:sticky lg:top-6 self-start">
              {/* About card */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 space-y-4">
                <p className="text-sm font-semibold text-gray-700">About</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {communityDetails.description}
                </p>

                <div className="space-y-3 pt-2 border-t border-orange-50">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-orange-400 shrink-0" />
                    <span>
                      <span className="font-semibold">
                        {communityDetails.member_count.toLocaleString()}
                      </span>{" "}
                      members
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 text-orange-400 shrink-0" />
                    <span>
                      Created{" "}
                      {formatDate(communityDetails.created_at, "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    {communityDetails.visibility === "private" ? (
                      <Lock className="h-4 w-4 text-orange-400 shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-orange-400 shrink-0" />
                    )}
                    <span className="capitalize">
                      {communityDetails.visibility} community
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator card */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  Created by
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-orange-500">
                      {communityDetails.community_creator?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {communityDetails.community_creator}
                  </p>
                </div>
              </div>

              {/* Create post CTA */}
              <Button
                onClick={handleCreatePost}
                className={`w-full rounded-xl py-5 text-sm font-semibold shadow-sm transition-all ${
                  isMember
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
                    : "bg-orange-200 text-orange-400 cursor-not-allowed"
                }`}
              >
                <PenLine className="h-4 w-4 mr-2" />
                {isMember ? "Create Post" : "Join to Post"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <CreatePostSheet />
    </div>
  );
};

export default SingleCommunityDetails;
