"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/state/redux";

import { AlertTriangle } from "lucide-react";
import { closeDeleteModal } from "@/state/slice/postSlice";
import { useDeletePostMutation } from "@/state/api/postsApi";
import { toast } from "sonner";

const DeletePostModal = () => {
  const dispatch = useAppDispatch();
  const { isDeleteModalOpen, deletingPost } = useAppSelector(
    (state) => state.posts,
  );
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  const handleClose = () => {
    dispatch(closeDeleteModal());
  };

  const handleDelete = async () => {
    try {
      if (deletingPost) await deletePost(deletingPost?.id).unwrap();
      toast.success("Post deleted successfully");
      handleClose();
    } catch (error: any) {
      console.log(error);
      toast.error(error.data);
    }
  };

  return (
    <Dialog open={isDeleteModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl bg-white lato-regular">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            Delete Post?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 leading-relaxed">
            This action cannot be undone. This will permanently delete your post
            <span className="font-medium text-gray-900">
              {" "}
              "{deletingPost?.title}"
            </span>{" "}
            and remove all associated comments and votes.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto h-11 rounded-full border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto h-11 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Post"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePostModal;
