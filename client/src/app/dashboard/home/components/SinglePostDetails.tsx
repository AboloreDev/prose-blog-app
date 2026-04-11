import { useNavigate, useParams } from "react-router-dom";
import { Flag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetPostByIdQuery } from "@/state/api/postsApi";
import PostSkeleton from "@/components/code/Skeleton/PostSkeleton";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostActions from "./PostActions";
import PostSidebar from "./PostSidebar";
import CommentInput from "./comments/CommentInput";
import CommentsList from "./comments/CommentsList";

const SinglePostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const postId = Number(id);

  const { data: post, isLoading, error } = useGetPostByIdQuery(postId);

  if (isLoading) return <PostSkeleton />;
  if (error || !post) return <ErrorState onBack={() => navigate(-1)} />;

  return (
    <div className="min-h-screen pb-12">
      <PostHeader postId={post.id} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main content */}
          <div className="lg:col-span-8">
            <PostContent post={post} />
            <PostActions post={post} />

            <div className="bg-orange-100 rounded-xl p-4 mt-6 space-y-4">
              <h3 className="text-base font-semibold">
                Comments ({post.comment_count || 0})
              </h3>
              <CommentInput postId={post.id} />
              <CommentsList postId={post.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <PostSidebar post={post} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorState = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <Flag className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
      <h2 className="text-xl font-bold mb-2">Post not found</h2>
      <p className="text-muted-foreground mb-6">
        This post doesn't exist or has been removed.
      </p>
      <Button onClick={onBack} className="rounded-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go Back
      </Button>
    </div>
  </div>
);

export default SinglePostDetails;
