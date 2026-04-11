// components/post/CommentInput.tsx
import { useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateCommentMutation } from "@/state/api/commentsApi";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import { addComment } from "@/state/slice/commentSlice";
import { Textarea } from "@/components/ui/textarea";

interface CommentInputProps {
  postId: number;
  parentId?: number | null;
  onSuccess?: () => void;
  placeholder?: string;
}

const CommentInput = ({
  postId,
  parentId = null,
  onSuccess,
  placeholder = "What are your thoughts?",
}: CommentInputProps) => {
  const dispatch = useAppDispatch();
  const [body, setBody] = useState("");
  const [createComment, { isLoading }] = useCreateCommentMutation();
  const user = useAppSelector((state: RootState) => state.auth.user);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const handleSubmit = async () => {
    if (!body.trim()) return;
    try {
      const result = await createComment({
        postId,
        data: { body, parent_id: parentId },
      }).unwrap();

      dispatch(
        addComment({
          id: result.id,
          author: user?.username ?? "",
          body,
          user_id: user?.id ?? 0,
          post_id: postId,
          parent_id: parentId,
          comment_vote_count: 0,
          reply_count: 0,
          total_records: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      );

      setBody("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-white border rounded-xl">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user?.profile?.avatar_url} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 flex flex-col gap-2 ">
        <Textarea
          placeholder={placeholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="resize-none min-h-[80px] border-0 focus-visible:ring-0 p-0 text-sm"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="rounded-full gap-2"
            disabled={!body.trim() || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <SendHorizonal className="h-3.5 w-3.5" />
            )}
            {parentId ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
