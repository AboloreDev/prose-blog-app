import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import {
  useGetPostByIdQuery,
  useUpdatePostMutation,
} from "@/state/api/postsApi";
import { useAppDispatch, useAppSelector } from "@/state/redux";

import type { RootState } from "@/state/redux";
import {
  updatePostSchema,
  type UpdatePostFormValues,
} from "@/schema/postSchema";
import { closeEditSheet } from "@/state/slice/postSlice";
import { toast } from "sonner";

const EditPostsSheet = () => {
  const dispatch = useAppDispatch();
  const [updatePost, { isLoading }] = useUpdatePostMutation();
  const { isEditPostsSheetOpen, editingPost } = useAppSelector(
    (state: RootState) => state.posts,
  );
  const { refetch } = useGetPostByIdQuery(editingPost?.id ?? 0, {
    skip: !editingPost?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdatePostFormValues>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      title: editingPost?.title,
      body: editingPost?.body,
    },
  });

  useEffect(() => {
    if (editingPost) {
      reset({
        title: editingPost.title,
        body: editingPost.body,
      });
    }
  }, [reset, editingPost]);

  const onSubmit = async (values: UpdatePostFormValues) => {
    try {
      if (!editingPost?.id) return;

      // convert to FormData — backend uses ParseMultipartForm
      const formData = new FormData();
      if (values.title) formData.append("title", values.title);
      if (values.body) formData.append("body", values.body);

      await updatePost({ id: editingPost.id, data: formData }).unwrap();
      await refetch();
      toast.success("Post updated successfully");
      dispatch(closeEditSheet());
    } catch (error: any) {
      console.log(error);
      toast.error(error?.data ?? "Failed to update post");
    }
  };

  const handleClose = () => {
    dispatch(closeEditSheet());
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div onClick={stopPropagation}>
      <Sheet open={isEditPostsSheetOpen} onOpenChange={handleClose}>
        <SheetContent className="!w-full md:!max-w-2xl bg-orange-100 flex flex-col p-6 lato-regular">
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-2xl font-bold text-gray-900">
              Edit Post
            </SheetTitle>
            <SheetDescription className="text-gray-600">
              Posts can only be edited within 1 hour of creation.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit(
              (data) => onSubmit(data),
              (errors) => console.log("❌ Form Errors:", errors),
            )}
            className="flex flex-col flex-1 gap-5 py-6 overflow-y-auto"
          >
            {/* Root error */}
            {errors.root && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {errors.root.message}
              </div>
            )}

            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="title"
                className="text-xl font-medium text-gray-700"
              >
                Title
              </Label>
              <Input
                id="title"
                placeholder="Post title"
                {...register("title")}
                className="bg-white border-gray-200 rounded-lg h-11 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-orange-300"
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Body */}
            <div className="flex flex-col gap-2 flex-1">
              <Label
                htmlFor="body"
                className="text-xl font-medium text-gray-700"
              >
                Body
              </Label>
              <Textarea
                id="body"
                placeholder="What's on your mind?"
                className="min-h-[200px] resize-none bg-white border-gray-200 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-orange-300"
                {...register("body")}
              />
              {errors.body && (
                <p className="text-xs text-red-500">{errors.body.message}</p>
              )}
            </div>

            <SheetFooter className="mt-auto pt-6 gap-3">
              <button
                type="button"
                className="flex-1 h-11 px-6 py-3 rounded-full bg-white border-gray-300 hover:bg-gray-100 text-gray-700"
                disabled={isLoading}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading || !isDirty}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EditPostsSheet;
