import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import { useGetAllPostsQuery } from "@/state/api/postsApi";
import { Button } from "@/components/ui/button";
import { Loader2, ServerCrash, Inbox } from "lucide-react";
import { setMetadata } from "@/state/slice/postSlice";
import Header from "@/components/code/Header";
import PostCard from "./components/PostCards";
import { CreatePostCard } from "./components/create/CreatePostCard";

const Home = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(
    (state: RootState) => state.global.searchQuery,
  );
  const { metadata } = useAppSelector((state: RootState) => state.posts);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useGetAllPostsQuery({
    page,
    page_size: 10,
    query: searchQuery,
    order_by: "",
  });

  const posts = data?.Posts;

  useEffect(() => {
    if (data?.MetaData) {
      dispatch(setMetadata(data.MetaData));
    }
  }, [data, dispatch]);

  return (
    <div className="flex flex-col h-screen">
      <Header title="Home" subTitle="Your feed" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Feed - Center/Left */}
            <div className="lg:col-span-8 space-y-6">
              {/* Create Post - Shows ONLY on small screens (lg:hidden) */}
              <div className="lg:hidden">
                <CreatePostCard />
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Loading posts...
                  </p>
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <ServerCrash className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load posts. Try again later.
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !isError && posts?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Inbox className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No posts yet. Join a community and start posting.
                  </p>
                </div>
              )}

              {/* Posts list */}
              {!isLoading && !isError && posts && posts.length > 0 && (
                <div className="flex flex-col space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !isError && metadata && (
                <div className="flex items-center justify-between mt-6 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Previous"
                    )}
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    Page {metadata.current_page} of {metadata.last_page}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === metadata.last_page || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Next"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Right Sidebar - Shows ONLY on large screens (hidden on small) */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              <div className="sticky top-4 space-y-6">
                <CreatePostCard />

                {/* Community Suggestions */}
                <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm mb-4">
                    Trending Communities
                  </h3>
                  <div className="space-y-3">
                    {["technology", "science", "funny"].map((community) => (
                      <div
                        key={community}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                            {community[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            pr/{community}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs rounded-full"
                        >
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
