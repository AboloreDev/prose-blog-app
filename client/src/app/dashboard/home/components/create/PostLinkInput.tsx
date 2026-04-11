import { Link2 } from "lucide-react";

interface PostLinkInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export const PostLinkInput = ({
  value,
  onChange,
  error,
}: PostLinkInputProps) => {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="url"
          placeholder="Paste your link here"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
        />
      </div>
      {error && <p className="text-xs text-destructive pl-1">{error}</p>}
    </div>
  );
};
