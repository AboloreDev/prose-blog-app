import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Community } from "@/state/types/communityTypes";
import { Loader2 } from "lucide-react";

interface CommunitySelectorProps {
  communities: Community[];
  isLoading: boolean;
  value: number | undefined;
  onChange: (id: number) => void;
  error?: string;
}

export const CommunitySelector = ({
  communities,
  isLoading,
  value,
  onChange,
  error,
}: CommunitySelectorProps) => {
  const safeCommunities = communities ?? [];

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
        <SelectContent className="bg-white rounded-2xl translate-y-8 p-2">
          {safeCommunities.length === 0 ? (
            <div className=" text-sm text-muted-foreground text-center">
              You don't belong to any community yet
            </div>
          ) : (
            safeCommunities.map((community) => (
              <SelectItem
                key={community.id}
                value={String(community.id)}
                className="cursor-pointer"
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
