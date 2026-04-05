import AuthLayout from "../AuthLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { toggleShowPassword } from "@/state/slice/globalSlice";
import { useRegisterUserMutation } from "@/state/api/authAp";
import { registerSchema, type RegisterFormData } from "@/schema/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { setAccessToken, setUser } from "@/state/slice/authSlice";

const Register = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showPassword } = useAppSelector((state: RootState) => state.global);
  const [registerUser, { isLoading }] = useRegisterUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerUser(data).unwrap();
      dispatch(setAccessToken(response.access_token));
      dispatch(
        setUser({
          id: response.user_id,
          username: response.username,
          email: response.email,
        }),
      );
      navigate("/dashboard/feed");
      toast.success("Welcome to prose! Account created.");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.status === "FETCH_ERROR") {
        toast.error("Network error. Please check your internet connection.");
        return;
      }
      let errorMessage = "Something went wrong. Please try again.";

      if (error.data) {
        if (
          error.data.errors &&
          Array.isArray(error.data.errors) &&
          error.data.errors.length > 0
        ) {
          errorMessage = error.data.errors.join(", ");
        } else if (error.data.message && error.data.message !== "Bad Request") {
          errorMessage = error.data.message;
        }

        toast.error(errorMessage);
      }
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join prose today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Username */}
        <div
          className="space-y-2"
          style={{
            opacity: 0,
            animation:
              "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards",
          }}
        >
          <Label
            htmlFor="username"
            className="text-neutral-300 text-sm font-medium"
          >
            Username
          </Label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors duration-300" />
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              className={cn(
                "pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-300 h-11",
                errors.username &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              )}
              {...register("username")}
            />
          </div>
          {errors.username && (
            <p className="text-red-400 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div
          className="space-y-2"
          style={{
            opacity: 0,
            animation:
              "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards",
          }}
        >
          <Label
            htmlFor="email"
            className="text-neutral-300 text-sm font-medium"
          >
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors duration-300" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className={cn(
                "pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-300 h-11",
                errors.email &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div
          className="space-y-2"
          style={{
            opacity: 0,
            animation:
              "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards",
          }}
        >
          <Label
            htmlFor="password"
            className="text-neutral-300 text-sm font-medium"
          >
            Password
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors duration-300" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={cn(
                "pl-10 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-300 h-11",
                errors.password &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => dispatch(toggleShowPassword())}
              className="absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors duration-200"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div
          className="space-y-2"
          style={{
            opacity: 0,
            animation:
              "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards",
          }}
        >
          <Label
            htmlFor="confirmPassword"
            className="text-neutral-300 text-sm font-medium"
          >
            Confirm Password
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors duration-300" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={cn(
                "pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-300 h-11",
                errors.confirmPassword &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              )}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <div
          style={{
            opacity: 0,
            animation:
              "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards",
          }}
        >
          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-medium h-11 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>

        {/* Login Link */}
        <p
          className="text-center text-sm text-neutral-400"
          style={{
            opacity: 0,
            animation: "fadeIn 0.5s ease 0.6s forwards",
          }}
        >
          Already have an account?{" "}
          <button
            type="button"
            className="text-white hover:underline font-medium transition-all duration-200"
            onClick={() => navigate("/auth/login")}
          >
            Sign in
          </button>
        </p>
      </form>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </AuthLayout>
  );
};

export default Register;
