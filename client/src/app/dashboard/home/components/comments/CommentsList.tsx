// components/post/CommentsList.tsx
import { useEffect } from "react";
import { MessageSquare, Loader2, ServerCrash } from "lucide-react";
import { useGetCommentsByPostQuery } from "@/state/api/commentsApi";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import CommentCard from "./CommentCard";
import { setComments } from "@/state/slice/commentSlice";

interface CommentsListProps {
  postId: number;
}

const CommentsList = ({ postId }: CommentsListProps) => {
  const dispatch = useAppDispatch();
  const comments = useAppSelector(
    (state: RootState) => state.comments.comments,
  );

  const { data, isLoading, isError } = useGetCommentsByPostQuery({
    postId,
    page_size: 20,
  });

  useEffect(() => {
    if (data?.Comments) {
      dispatch(
        setComments({
          postId,
          comments: data.Comments,
        }),
      );
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <ServerCrash className="h-8 w-8 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          Failed to load comments.
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <MessageSquare className="h-8 w-8 text-muted-foreground opacity-20" />
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
};

export default CommentsList;
