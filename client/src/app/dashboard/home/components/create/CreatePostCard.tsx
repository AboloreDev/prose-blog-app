import { Plus, Image as ImageIcon, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { openSheet } from "@/state/slice/postSlice";
import { CreatePostSheet } from "./CreatePostSheet";

export const CreatePostCard = () => {
  const dispatch = useDispatch();

  return (
    <div className="bg-orange-200/50 rounded-xl border border-orange-300 overflow-hidden shadow-sm p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Create Post"
            className="w-full bg-white rounded-full px-4 py-2.5 text-sm border border-orange-300/50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer hover:bg-gray-50"
            readOnly
            onClick={() => dispatch(openSheet({ tab: "text" }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:text-foreground hover:bg-orange-300/30"
          onClick={() => dispatch(openSheet({ tab: "text" }))}
        >
          <Plus className="h-4 w-4" />
          Text
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:text-foreground hover:bg-orange-300/30"
          onClick={() => dispatch(openSheet({ tab: "image" }))}
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:text-foreground hover:bg-orange-300/30"
          onClick={() => dispatch(openSheet({ tab: "link" }))}
        >
          <Link2 className="h-4 w-4" />
          Link
        </Button>
      </div>

      <CreatePostSheet />
    </div>
  );
};
