import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Image as ImageIcon, Link2 } from "lucide-react";
import { CommunitySelector } from "./CommunitySelector";
import type { RootState } from "@/state/redux";
import { useGetUserCommunitiesQuery } from "@/state/api/communityApi";
import { useCreatePostMutation } from "@/state/api/postsApi";
import {
  createPostSchema,
  type CreatePostFormValues,
} from "@/schema/postSchema";
import { closeSheet, setActiveTab } from "@/state/slice/postSlice";
import { PostTitleInput } from "./PostTitle";
import { PostBodyInput } from "./PostBody";
import { PostLinkInput } from "./PostLinkInput";
import { useState } from "react";
import { PostImageUpload } from "./PostImageUploader";
import { PostStatusSelector } from "./PostStatus";
import { toast } from "sonner";

export const CreatePostSheet = () => {
  const dispatch = useDispatch();
  const isSheetOpen = useSelector(
    (state: RootState) => state.posts.isSheetOpen,
  );
  const activeTab = useSelector((state: RootState) => state.posts.activeTab);
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: communities = [], isLoading: communitiesLoading } =
    useGetUserCommunitiesQuery({ id: userId! }, { skip: !userId });

  const [createPost, { isLoading: isSubmitting }] = useCreatePostMutation();

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      body: "",
      link_url: "",
      community_id: undefined,
      status: "published",
      publish_at: "",
    },
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const watchedStatus = form.watch("status");

  const buildFormData = (values: CreatePostFormValues) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("community_id", String(values.community_id));
    formData.append("status", values.status);
    if (values.body) formData.append("body", values.body);
    if (values.link_url) formData.append("link_url", values.link_url);
    if (imageFile) formData.append("image", imageFile);
    if (values.status === "scheduled" && values.publish_at) {
      const utc = new Date(values.publish_at).toISOString();
      formData.append("publish_at", utc);
    }
    return formData;
  };

  const onSubmit = async (values: CreatePostFormValues) => {
    try {
      await createPost(buildFormData(values)).unwrap();
      toast.success(
        values.status === "draft"
          ? "Draft saved successfully"
          : values.status === "scheduled"
            ? "Post scheduled successfully"
            : "Post created successfully",
      );
      dispatch(closeSheet());
      form.reset();
    } catch (err) {
      toast.error("Failed to create post. Please try again.");
    }
  };

  const onSaveDraft = () => {
    form.setValue("status", "draft");
    form.handleSubmit(onSubmit)();
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      dispatch(closeSheet());
      form.reset();
    }
  };

  const tabs = [
    { key: "text" as const, label: "Text", icon: Plus },
    { key: "image" as const, label: "Image & Video", icon: ImageIcon },
    { key: "link" as const, label: "Link", icon: Link2 },
  ];

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
      <SheetContent
        side="right"
        className="!max-w-xl overflow-hidden overflow-y-auto px-4 bg-orange-200 border-none lato-regular"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-semibold">Create Post</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CommunitySelector
            communities={communities}
            isLoading={communitiesLoading}
            value={form.watch("community_id")}
            onChange={(id) =>
              form.setValue("community_id", id, { shouldValidate: true })
            }
          />

          {/* Tab switcher */}
          <div className="flex border-b border-border">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => dispatch(setActiveTab(key))}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Title — always visible */}
          <PostTitleInput
            value={form.watch("title")}
            onChange={(val) =>
              form.setValue("title", val, { shouldValidate: true })
            }
            error={form.formState.errors.title?.message}
          />

          {/* Tab content */}
          {activeTab === "text" && (
            <PostBodyInput
              value={form.watch("body") ?? ""}
              onChange={(val) => form.setValue("body", val)}
            />
          )}

          {activeTab === "image" && (
            <PostImageUpload onFileSelect={(file) => setImageFile(file)} />
          )}

          {activeTab === "link" && (
            <PostLinkInput
              value={form.watch("link_url") ?? ""}
              onChange={(val) =>
                form.setValue("link_url", val, { shouldValidate: true })
              }
              error={form.formState.errors.link_url?.message}
            />
          )}

          {/* Status — always visible */}
          <PostStatusSelector
            status={watchedStatus}
            publishAt={form.watch("publish_at") ?? ""}
            onStatusChange={(val) =>
              form.setValue("status", val, { shouldValidate: true })
            }
            onPublishAtChange={(val) =>
              form.setValue("publish_at", val, { shouldValidate: true })
            }
            statusError={form.formState.errors.status?.message}
            publishAtError={form.formState.errors.publish_at?.message}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 rounded-full font-bold bg-slate-300 hover:bg-slate-400 px-4 py-2 cursor-pointer"
              disabled={isSubmitting}
              onClick={onSaveDraft}
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mx-auto animate-spin" />
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
