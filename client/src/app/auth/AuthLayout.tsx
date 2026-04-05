import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black lato-regular p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="flex justify-center ">
          <img src="/logo.png" alt="Prose-logo" className="w-20 h-20" />
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <h1 className="text-2xl font-semibold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 text-center">
              {title}
            </h1>
            <p className="text-neutral-400 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 text-center">
              {subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">{children}</div>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-500 text-sm mt-8 animate-in fade-in duration-700 delay-300">
          By continuing, you agree to our{" "}
          <a
            href="#"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Privacy
          </a>
        </p>
      </div>
    </div>
  );
}
