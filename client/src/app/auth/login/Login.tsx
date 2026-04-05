import AuthLayout from "../AuthLayout";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { toggleShowPassword } from "@/state/slice/globalSlice";
import { useLoginUserMutation } from "@/state/api/authAp";
import { loginSchema, type LoginFormData } from "@/schema/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { setAccessToken, setUser } from "@/state/slice/authSlice";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showPassword } = useAppSelector((state: RootState) => state.global);
  const [loginUser, { isLoading }] = useLoginUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginUser(data).unwrap();
      dispatch(setAccessToken(response.access_token));
      dispatch(
        setUser({
          id: response.user_id,
          username: response.username,
          email: response.email,
        }),
      );
      navigate("/dashboard/feed");
      toast.success("Logged in successfully!");
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
    <AuthLayout title="Welcome back" subtitle="Sign in to your prose account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
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

        {/* Password Field */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-neutral-300 text-sm font-medium"
            >
              Password
            </Label>
            <a
              href="#"
              className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              Forgot?
            </a>
          </div>
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
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors duration-200"
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

        {/* Remember me */}
        <div className="flex items-center gap-2 animate-in fade-in duration-500 delay-400">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-white focus:ring-white/20 cursor-pointer"
          />
          <label
            htmlFor="remember"
            className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-300 transition-colors"
          >
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-medium h-11 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>

        {/* Divider */}
        <div className="relative animate-in fade-in duration-500 delay-500">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-900 px-2 text-neutral-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-neutral-400 animate-in fade-in duration-500 delay-500">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-white hover:underline font-medium transition-all duration-200"
            onClick={() => navigate("/auth/register")}
          >
            Create one
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
