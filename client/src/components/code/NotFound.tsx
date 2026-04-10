import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, Compass } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-4 lato-regular">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Graphic */}
        <div className="relative">
          <div className="text-9xl font-black text-orange-200 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-orange-500 rounded-2xl rotate-12 shadow-xl flex items-center justify-center">
              <Search className="h-12 w-12 text-white -rotate-12" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Oops! The page you're looking for seems to have wandered off. It
            might have been moved, deleted, or never existed.
          </p>
        </div>

        {/* Suggestions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/dashboard/feeds")}
            className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 rounded-full shadow-lg shadow-orange-200"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/explore")}
            className="h-12 px-8 rounded-full border-orange-200 hover:bg-orange-50 text-orange-700"
          >
            <Compass className="h-4 w-4 mr-2" />
            Explore Communities
          </Button>
        </div>

        {/* Prose Branding */}
        <div className="pt-8 border-t border-orange-200">
          <div className="flex items-center justify-center gap-2 text-orange-600 font-bold text-xl">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">pr</span>
            </div>
            <span>Prose</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Lost? There's always something interesting on the home feed.
          </p>
        </div>

        {/* Fun Elements */}
        <div className="flex justify-center gap-2 pt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
