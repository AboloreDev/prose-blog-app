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
      navigate("/dashboard/feeds");
      toast.success("Welcome back to Prose!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Prose account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
          <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className={cn(
                "pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-300 h-11 rounded-xl",
                errors.email &&
                  "border-red-500 focus:border-red-500 focus:ring-red-100",
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-gray-700 text-sm font-medium"
            >
              Password
            </Label>
            <a
              href="#"
              className="text-sm text-slate-500 transition-colors duration-200 font-medium"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={cn(
                "pl-10 pr-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-300 h-11 rounded-xl",
                errors.password &&
                  "border-red-500 focus:border-red-500 focus:ring-red-100",
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => dispatch(toggleShowPassword())}
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 animate-in fade-in duration-500 delay-400">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 rounded border-gray-300 bg-white text-orange-500 focus:ring-orange-500/20 cursor-pointer accent-orange-500"
          />
          <label
            htmlFor="remember"
            className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
          >
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full bg-white text-black font-medium h-11 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full animate-spin" />
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
            <div className="w-full border-t border-orange-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-orange-50 px-2 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-600 animate-in fade-in duration-500 delay-500">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-orange-600 hover:text-orange-700 font-semibold transition-all duration-200 hover:underline"
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
