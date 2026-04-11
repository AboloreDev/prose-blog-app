import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Mail, User, FileText } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetAvatarsQuery,
  useUpdateProfileMutation,
} from "@/state/api/profileApi";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { setIsEditSheetOpen } from "@/state/slice/profileSlice";
import type { RootState } from "@/state/redux";
import type { UserProfile } from "@/state/types/profileTypes";
import { toast } from "sonner";
import { useGetUserProfileQuery } from "@/state/api/userApi";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditProfileSheetProps {
  user: UserProfile;
}

const EditProfileSheet = ({ user }: EditProfileSheetProps) => {
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading: profileLoading }] =
    useUpdateProfileMutation();
  const isOpen = useAppSelector(
    (state: RootState) => state.profile.isEditSheetOpen,
  );
  const { refetch } = useGetUserProfileQuery({ id: user.id });
  const { data, isLoading: avatarLoading } = useGetAvatarsQuery([]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user.username,
      email: user.email,
      bio: user.profile?.bio,
      avatar_url: user.profile?.avatar_url,
    },
  });

  const selectedAvatar = watch("avatar_url");

  useEffect(() => {
    reset({
      username: user.username,
      email: user.email,
      bio: user.profile?.bio,
      avatar_url: user.profile?.avatar_url,
    });
  }, [user, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProfile({
        data: {
          username: values.username,
          email: values.email,
          // @ts-expect-error "<>"
          profile: {
            bio: values.bio,
            avatar_url: values.avatar_url,
          },
        },
      }).unwrap();

      await refetch();
      toast.success("Profile updated successfully");
      dispatch(setIsEditSheetOpen(false));
    } catch (error: any) {
      toast.error(error?.data ?? "Failed to update profile");
    }
  };

  const isLoading = profileLoading || avatarLoading;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => dispatch(setIsEditSheetOpen(open))}
    >
      <SheetContent className="!w-full md:!max-w-2xl flex flex-col p-0 bg-orange-100 lato-regular overflow-hidden">
        {/* Gradient header band */}
        <div className=" px-6 pt-6 pb-8">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">Edit Profile</SheetTitle>
            <SheetDescription className="">
              Update your profile information and avatar.
            </SheetDescription>
          </SheetHeader>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 gap-6 px-6 py-6 overflow-y-auto -mt-4"
        >
          {/* Root error */}
          {errors.root && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {errors.root.message}
            </div>
          )}

          {/* Avatar selection */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-3">
            <Label className="text-sm font-semibold text-gray-700">
              Choose Avatar
            </Label>
            {avatarLoading ? (
              <div className="grid grid-cols-5 gap-3 pt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-12 rounded-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3 pt-1">
                {(data?.avatars ?? []).map((url: string) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() =>
                      setValue("avatar_url", url, { shouldDirty: true })
                    }
                    className={`relative rounded-full transition-all duration-150 focus:outline-none ${
                      selectedAvatar === url
                        ? "ring-2 ring-orange-500 ring-offset-2 scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={url} />
                      <AvatarFallback className="bg-orange-100 text-orange-500 text-xs font-bold">
                        ?
                      </AvatarFallback>
                    </Avatar>
                    {selectedAvatar === url && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                        <Check
                          className="h-2.5 w-2.5 text-white"
                          strokeWidth={3}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-orange-400" />
              Username
            </Label>
            <Input
              id="username"
              placeholder="Your username"
              {...register("username")}
              className="bg-white border-orange-100 rounded-xl h-11 focus-visible:ring-orange-300"
            />
            {errors.username && (
              <p className="text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-orange-400" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              disabled
              readOnly
              placeholder="Your email"
              {...register("email")}
              className="bg-white border-orange-100 rounded-xl h-11 focus-visible:ring-orange-300"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="bio"
              className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-orange-400" />
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className="resize-none min-h-[100px] bg-white border-orange-100 rounded-xl focus-visible:ring-orange-300"
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <SheetFooter className="mt-auto pt-4 border-t border-orange-100 gap-3">
            <button
              type="button"
              className="flex-1 rounded-full bg-black text-white hover:bg-orange-50 px-4 py-2"
              disabled={isLoading}
              onClick={() => dispatch(setIsEditSheetOpen(false))}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
              disabled={isLoading || !isDirty}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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
  );
};

export default EditProfileSheet;
