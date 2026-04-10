import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  PenLine,
  Send,
  Trash2,
  Loader2,
  Eye,
  MessageSquare,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDeletePostMutation,
  usePublishDraftsMutation,
} from "@/state/api/postsApi";
import { toast } from "sonner";
import type { Post } from "@/state/types/postTypes";

interface DraftCardProps {
  post: Post;
}

const DraftCard = ({ post }: DraftCardProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [publishDrafts, { isLoading: isPublishing }] =
    usePublishDraftsMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const formData = new FormData();
      formData.append("status", "published");
      await publishDrafts({ id: post.id }).unwrap();
      toast.success("Published successfully!");
    } catch {
      toast.error("Failed to publish post.");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id).unwrap();
      toast.success("Draft deleted.");
    } catch {
      toast.error("Failed to delete draft.");
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/posts/scheduled/${post.id}`);
  };

  const handleCardClick = () => {
    navigate(`/dashboard/feeds/${post.id}`);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white border lato-regular border-orange-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
      >
        {/* Top row — community + badge + time */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="h-6 w-6 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <button
              className="text-sm font-medium text-gray-700 hover:text-orange-500 hover:underline transition-colors truncate max-w-[160px]"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/communities/${post.community_id}`);
              }}
            >
              pr/{post.community_name.toLowerCase().replace(/\s+/g, "-")}
            </button>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          <Badge className="bg-amber-100 text-amber-600 border border-amber-200 hover:bg-amber-100 text-xs shrink-0">
            Draft
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 group-hover:text-orange-600 transition-colors">
          {post.title}
        </h3>

        {/* Body preview + image */}
        <div className="flex gap-3 mb-4">
          {post.body && (
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
              {post.body}
            </p>
          )}
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-16 h-14 object-cover rounded-lg shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.view_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comment_count}
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2 pt-3 border-t border-orange-50"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full gap-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            onClick={handleEdit}
          >
            <PenLine className="h-3.5 w-3.5" />
            Edit
          </Button>

          <Button
            size="sm"
            className="h-8 rounded-full gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
            disabled={isPublishing}
            onClick={handlePublish}
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Publish
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="lato-regular bg-gradient-to-br from-orange-50 via-white to-orange-100 ">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete Draft"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DraftCard;
