import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Globe,
  Lock,
  Upload,
  Users,
  Sparkles,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createCommunitySchema,
  type CreateCommunityFormValues,
} from "@/schema/communitySchema";
import { useCreateCommunityMutation } from "@/state/api/communityApi";
import Header from "@/components/code/Header";

const CreateCommunity = () => {
  const [createCommunity, { isLoading }] = useCreateCommunityMutation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateCommunityFormValues>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      visibility: "public",
    },
  });

  const watchedName = form.watch("name");
  const watchedSlug = form.watch("slug");
  const watchedDescription = form.watch("description");
  const watchedVisibility = form.watch("visibility");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    form.setValue("name", val, { shouldValidate: true });
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_");
    form.setValue("slug", autoSlug, { shouldValidate: true });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: CreateCommunityFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("slug", values.slug);
    formData.append("description", values.description);
    formData.append("visibility", values.visibility);
    if (imageFile) formData.append("image", imageFile);

    try {
      await createCommunity(formData).unwrap();
      toast.success("Community created successfully!");
      // navigate(`dashboard/communities/${values.slug}`);
    } catch {
      toast.error("Failed to create community. Please try again.");
    }
  };

  return (
    <div className="min-h-screen lato-regular">
      <Header
        title="Create Community"
        subTitle="Build your space, set the rules"
      />
      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* ── Left: Form ── */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Community image */}
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Community Image
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-orange-200 rounded-2xl h-40 bg-orange-50/50 hover:bg-orange-100/40 transition-all overflow-hidden"
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-orange-300 mb-2" />
                    <p className="text-sm text-orange-400">
                      Click to upload community image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Name + Slug */}
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-5">
              <p className="text-sm font-semibold text-gray-700">Identity</p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Community Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence"
                  {...form.register("name")}
                  onChange={handleNameChange}
                  className="w-full rounded-xl border border-orange-200  px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-orange-400 font-medium">
                    pr/
                  </span>
                  <input
                    type="text"
                    placeholder="artificial_intelligence"
                    {...form.register("slug")}
                    className="w-full rounded-xl border border-orange-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                  />
                </div>
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Description
                </p>
                <span className="text-xs text-muted-foreground">
                  {watchedDescription.length}/500
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="What is your community about? What kind of posts are welcome?"
                {...form.register("description")}
                className="w-full rounded-xl border border-orange-200 bg-orange-50/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-gray-700">Visibility</p>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Public */}
                <button
                  type="button"
                  onClick={() => form.setValue("visibility", "public")}
                  className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 transition-all text-left ${
                    watchedVisibility === "public"
                      ? "border-orange-400 bg-orange-50"
                      : "border-orange-100 hover:border-orange-200"
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${watchedVisibility === "public" ? "bg-orange-100" : "bg-gray-100"}`}
                  >
                    <Globe
                      className={`h-4 w-4 ${watchedVisibility === "public" ? "text-orange-500" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Public
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Anyone can view and join
                    </p>
                  </div>
                </button>

                {/* Private */}
                <button
                  type="button"
                  onClick={() => form.setValue("visibility", "private")}
                  className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 transition-all text-left ${
                    watchedVisibility === "private"
                      ? "border-orange-400 bg-orange-50"
                      : "border-orange-100 hover:border-orange-200"
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${watchedVisibility === "private" ? "bg-orange-100" : "bg-gray-100"}`}
                  >
                    <Lock
                      className={`h-4 w-4 ${watchedVisibility === "private" ? "text-orange-500" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Private
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Invite only, posts hidden
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-orange-200 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Community
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* ── Right: Live Preview Sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* Preview card */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              {/* Banner */}
              <div className="h-20 bg-gradient-to-br from-orange-300 via-orange-400 to-amber-400 relative">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                )}
              </div>

              {/* Avatar */}
              <div className="px-4 pb-4">
                <div className="relative -mt-8 mb-3">
                  <div className="h-16 w-16 rounded-2xl border-4 border-white shadow-md bg-orange-100 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-orange-400">
                        {watchedName?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-bold text-gray-900 text-base leading-tight">
                  {watchedName || "Community Name"}
                </p>
                <p className="text-xs text-orange-500 mb-2">
                  pr/{watchedSlug || "slug"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {watchedDescription ||
                    "Your community description will appear here..."}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-orange-50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>0 members</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {watchedVisibility === "private" ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        <span>Public</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                Tips for a great community
              </p>
              <ul className="space-y-2.5">
                {[
                  "Pick a clear, memorable name",
                  "Write a description that sets expectations",
                  "Use a recognizable image",
                  "Start public — you can go private later",
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-semibold shrink-0 text-[10px]">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visibility explainer */}
            <div
              className={`rounded-2xl border p-4 text-xs transition-all ${
                watchedVisibility === "private"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              {watchedVisibility === "private" ? (
                <p>
                  <span className="font-semibold">Private community:</span> Only
                  members you invite can see posts and join.
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Public community:</span>{" "}
                  Anyone can discover, view posts and request to join.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;
