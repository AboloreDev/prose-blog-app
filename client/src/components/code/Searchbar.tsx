// components/ui/search-bar.tsx
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { setSearchQuery, clearSearch } from "@/state/slice/globalSlice";
import type { RootState } from "@/state/redux";

const SearchBar = ({ placeholder = "Search..." }: { placeholder?: string }) => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(
    (state: RootState) => state.global.searchQuery,
  );

  return (
    <div className="relative w-full border border-black rounded-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-9 pr-9 h-9 rounded-full bg-muted border-0 focus-visible:ring-1"
        value={searchQuery}
        onChange={(e) => dispatch(setSearchQuery(e.target.value))}
      />
      {searchQuery && (
        <button
          onClick={() => dispatch(clearSearch())}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
