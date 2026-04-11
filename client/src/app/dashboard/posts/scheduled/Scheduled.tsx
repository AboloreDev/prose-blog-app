import { useEffect, useState } from "react";
import { FileText, Loader2, PenLine, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/code/Header";
import { useGetUserScheduledQuery } from "@/state/api/postsApi";
import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { setMetadata, openSheet } from "@/state/slice/postSlice";
import type { Post } from "@/state/types/postTypes";
import { CreatePostSheet } from "../../home/components/create/CreatePostSheet";
import SearchBar from "@/components/code/Searchbar";
import UserPostCard from "../UserPostsCard";

const Scheduled = () => {
  const [page, setPage] = useState(1);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { searchQuery } = useAppSelector((state: RootState) => state.global);
  const { metadata } = useAppSelector((state: RootState) => state.posts);

  const { data, isLoading, isFetching, isError } = useGetUserScheduledQuery({
    page,
    page_size: 10,
    query: searchQuery,
    user_id: user?.id ?? 0,
    order_by: "DESC",
  });

  useEffect(() => {
    if (data?.MetaData) {
      dispatch(setMetadata(data.MetaData));
    }
  }, [data, dispatch]);

  const scheduledPosts = ((data as any)?.UserPosts ??
    data?.Posts ??
    []) as Post[];
  const totalScheduledPost = metadata?.total_records ?? scheduledPosts.length;

  return (
    <section className="h-screen overflow-hidden lato-regular flex flex-col">
      <Header
        title="Scheduled"
        subTitle={
          !isLoading && !isError && totalScheduledPost > 0
            ? `${totalScheduledPost} scheduled posts${totalScheduledPost !== 1 ? "s" : ""}`
            : "Your scheduled posts"
        }
      />

      <main className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
        <SearchBar />
        <div className="max-w-3xl mx-auto">
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <p className="text-sm text-muted-foreground">
                Loading scheduled posts...
              </p>
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <ServerCrash className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Failed to load scheduled posts. Try refreshing.
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && scheduledPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                <FileText className="h-8 w-8 text-orange-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-gray-700">
                  No Scheduled Posts yet
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Looks like you haven't scheduled any post.
                </p>
              </div>
              <Button
                className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-white gap-2 mt-1"
                onClick={() => dispatch(openSheet({ tab: "text" }))}
              >
                <PenLine className="h-4 w-4" />
                Create a post
              </Button>
            </div>
          )}

          {/* Draft list */}
          {!isLoading && !isError && scheduledPosts.length > 0 && (
            <div
              className={`space-y-3 transition-opacity duration-200 ${
                isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {scheduledPosts.map((post) => (
                <UserPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && metadata && metadata.last_page > 1 && (
            <div className="flex items-center justify-between mt-8 pb-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-orange-200 hover:bg-orange-50"
                disabled={page === 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "← Previous"
                )}
              </Button>

              <span className="text-xs text-muted-foreground">
                Page {metadata.current_page} of {metadata.last_page}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-orange-200 hover:bg-orange-50"
                disabled={page === metadata.last_page || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Next →"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      <CreatePostSheet />
    </section>
  );
};

export default Scheduled;
