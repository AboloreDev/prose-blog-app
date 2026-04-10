import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Community } from "@/state/types/communityTypes";
import { Loader2, Lock } from "lucide-react";

interface CommunitySelectorProps {
  communities: Community[];
  isLoading: boolean;
  value: number | undefined;
  onChange: (id: number) => void;
  error?: string;
  readOnly?: boolean;
  readOnlyName?: string;
}

export const CommunitySelector = ({
  communities,
  isLoading,
  value,
  onChange,
  error,
  readOnly,
  readOnlyName,
}: CommunitySelectorProps) => {
  const safeCommunities = communities ?? [];

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border-none w-fit">
        <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-orange-500">
            {readOnlyName?.[0]?.toUpperCase() ?? "C"}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          pr/{readOnlyName}
        </span>
        <Lock className="h-3 w-3 text-muted-foreground ml-1" />
      </div>
    );
  }

  return (
    <div className="space-y-1 border-none">
      <Select
        value={value ? String(value) : ""}
        onValueChange={(val) => onChange(Number(val))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full rounded-full bg-white border-none">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading communities...
            </span>
          ) : (
            <SelectValue placeholder="Select a community" />
          )}
        </SelectTrigger>
        <SelectContent className="bg-white rounded-2xl translate-y-8 p-3">
          {safeCommunities.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              You don't belong to any community yet
            </div>
          ) : (
            safeCommunities.map((community) => (
              <SelectItem
                key={community.id}
                value={String(community.id)}
                className="rounded-xl px-4 py-3 cursor-pointer"
              >
                pr/{community.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive pl-1">{error}</p>}
    </div>
  );
};
