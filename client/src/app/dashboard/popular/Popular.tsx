import Header from "@/components/code/Header";
import { Loader2, TrendingUp } from "lucide-react";
import PostCard from "../home/components/PostCards";
import { useGetTrendingPostsQuery } from "@/state/api/postsApi";

const Popular = () => {
  const { data, isLoading } = useGetTrendingPostsQuery({ limit: 20 });

  return (
    <div className="flex flex-col h-full">
      <Header title="Popular" subTitle="Trending in the last 48 hours" />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && !data?.posts?.length && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <TrendingUp className="h-10 w-10 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground">
              No trending posts yet. Check back later.
            </p>
          </div>
        )}
        {!isLoading &&
          data?.posts?.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
      </div>
    </div>
  );
};

export default Popular;
