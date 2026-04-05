// components/CreateCommunity.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Globe,
  Lock,
  Eye,
  Hash,
  Upload,
  X,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Header from "@/components/code/Header";

type VisibilityType = "public" | "restricted" | "private";

interface CommunityForm {
  name: string;
  displayName: string;
  description: string;
  visibility: VisibilityType;
  avatar: File | null;
  banner: File | null;
  tags: string[];
}

const visibilityOptions: {
  value: VisibilityType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can view, post, and comment",
    icon: Globe,
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Anyone can view, but only members can post",
    icon: Eye,
  },
  {
    value: "private",
    label: "Private",
    description: "Only approved members can view and post",
    icon: Lock,
  },
];

export const CreateCommunity = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CommunityForm>({
    name: "",
    displayName: "",
    description: "",
    visibility: "public",
    avatar: null,
    banner: null,
    tags: [],
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  // Auto-generate name from display name
  const handleDisplayNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      displayName: value,
      name: value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 21),
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Avatar must be less than 2MB");
        return;
      }
      setForm((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Banner must be less than 5MB");
        return;
      }
      setForm((prev) => ({ ...prev, banner: file }));
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const addTag = () => {
    if (
      tagInput.trim() &&
      !form.tags.includes(tagInput.trim()) &&
      form.tags.length < 5
    ) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    navigate(`/dashboard/communities/${form.name}`);
  };

  const isStep1Valid =
    form.displayName.length >= 3 && form.description.length >= 10;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Custom Header */}
      <div className="bg-white border-b border-orange-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Create Community
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Build your space in 2 simple steps
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div
                  className={`w-8 h-1.5 rounded-full ${step >= 1 ? "bg-orange-500" : "bg-gray-200"}`}
                />
                <div
                  className={`w-8 h-1.5 rounded-full ${step >= 2 ? "bg-orange-500" : "bg-gray-200"}`}
                />
              </div>
              <span className="text-sm text-gray-500 font-medium">
                Step {step}/2
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-8 space-y-6">
            {step === 1 ? (
              <div className="bg-white rounded-2xl border border-orange-200/60 shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Community Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="What should we call this community?"
                      value={form.displayName}
                      onChange={(e) => handleDisplayNameChange(e.target.value)}
                      className="h-12 text-lg border-gray-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        This will be your public display name
                      </span>
                      <span
                        className={`${form.displayName.length > 50 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {form.displayName.length}/100
                      </span>
                    </div>
                  </div>

                  {/* Auto-generated URL Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Community URL
                    </Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-500 font-medium">pr/</span>
                      <span className="font-semibold text-gray-900">
                        {form.name || "community-name"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Auto-generated from your display name. Cannot be changed
                      later.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder="What is this community about? Be specific so people know what to expect..."
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="min-h-[120px] resize-none border-gray-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        Minimum 10 characters
                      </span>
                      <span
                        className={`${form.description.length > 480 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {form.description.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Topics{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Add topics (e.g., technology, gaming)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                          className="pl-10 border-gray-200 focus:border-orange-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        disabled={!tagInput.trim() || form.tags.length >= 5}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Add up to 5 topics to help people find your community
                    </p>
                  </div>
                </div>

                {/* Step 1 Footer */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Identity Card */}
                <div className="bg-white rounded-2xl border border-orange-200/60 shadow-sm overflow-hidden">
                  <div className="p-6 space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-orange-500" />
                      Visual Identity
                    </h3>

                    {/* Banner Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Banner Image
                      </Label>
                      <div className="relative">
                        {bannerPreview ? (
                          <div className="relative h-32 rounded-xl overflow-hidden group">
                            <img
                              src={bannerPreview}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setBannerPreview(null);
                                setForm((prev) => ({ ...prev, banner: null }));
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">
                              Upload banner (optional)
                            </span>
                            <span className="text-xs text-gray-400">
                              Recommended: 1920×384, max 5MB
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBannerChange}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Avatar Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Community Avatar
                      </Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-orange-200">
                          {avatarPreview ? (
                            <AvatarImage src={avatarPreview} />
                          ) : (
                            <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl font-bold">
                              {form.displayName[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                            <Upload className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Upload avatar
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Recommended: 256×256, max 2MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility Settings */}
                <div className="bg-white rounded-2xl border border-orange-200/60 shadow-sm overflow-hidden">
                  <div className="p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-orange-500" />
                      Visibility Settings
                    </h3>

                    <div className="grid gap-3">
                      {visibilityOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = form.visibility === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                visibility: option.value,
                              }))
                            }
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50/50"
                                : "border-gray-200 hover:border-orange-200 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${isSelected ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {option.label}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {option.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step 2 Footer */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <>
                        Create Community
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-orange-200/60 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Live Preview
                  </h3>
                </div>

                <div className="p-4">
                  {/* Mini Community Card Preview */}
                  <div className="relative">
                    {/* Banner Preview */}
                    <div className="h-20 rounded-lg bg-gradient-to-r from-orange-100 to-orange-200 overflow-hidden">
                      {bannerPreview && (
                        <img
                          src={bannerPreview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Avatar Preview */}
                    <div className="absolute -bottom-6 left-4">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} />
                        ) : (
                          <AvatarFallback className="bg-orange-500 text-white text-xl font-bold">
                            {form.displayName[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>

                  {/* Community Info */}
                  <div className="mt-8 space-y-2">
                    <h4 className="font-bold text-gray-900 text-lg">
                      {form.displayName || "Community Name"}
                    </h4>
                    <p className="text-sm text-gray-500 font-medium">
                      pr/{form.name || "community"}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {form.description ||
                        "Community description will appear here..."}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />1 member
                      </span>
                      <span className="flex items-center gap-1">
                        {form.visibility === "public" ? (
                          <Globe className="h-3.5 w-3.5" />
                        ) : form.visibility === "private" ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {visibilityOptions.find(
                          (v) => v.value === form.visibility,
                        )?.label || "Public"}
                      </span>
                    </div>

                    {form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {form.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Mock Post Preview */}
                  <div className="space-y-3 opacity-60">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                <h4 className="font-semibold text-orange-800 text-sm mb-2">
                  Tips for success
                </h4>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    Choose a clear, descriptive name
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    Add relevant topics for discoverability
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    Set appropriate visibility from the start
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;
