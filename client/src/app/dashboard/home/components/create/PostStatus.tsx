import { CalendarClock } from "lucide-react";

type Status = "draft" | "published" | "scheduled";

interface PostStatusSelectorProps {
  status: Status;
  publishAt: string;
  onStatusChange: (val: Status) => void;
  onPublishAtChange: (val: string) => void;
  statusError?: string;
  publishAtError?: string;
}

const STATUS_OPTIONS: { label: string; value: Status }[] = [
  { label: "Draft", value: "draft" },
  { label: "Publish Now", value: "published" },
  { label: "Schedule", value: "scheduled" },
];

const getNowLocal = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
};

export const PostStatusSelector = ({
  status,
  publishAt,
  onStatusChange,
  onPublishAtChange,
  statusError,
  publishAtError,
}: PostStatusSelectorProps) => {
  return (
    <div className="space-y-3 ">
      {/* Toggle buttons */}
      <div className="flex rounded-lg bg-white border-none  overflow-hidden">
        {STATUS_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusChange(value)}
            className={`flex-1 py-2 text-sm cursor-pointer font-medium transition-colors ${
              status === value
                ? "bg-orange-500 text-white"
                : "bg-background text-muted-foreground hover:bg-orange-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {statusError && (
        <p className="text-xs text-destructive pl-1">{statusError}</p>
      )}

      {/* Datetime picker — only when scheduled */}
      {status === "scheduled" && (
        <div className="space-y-4">
          <div className="relative">
            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <input
              type="datetime-local"
              min={getNowLocal()}
              value={publishAt}
              onChange={(e) => onPublishAtChange(e.target.value)}
              className="w-full rounded-lg border border-input pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>
          {publishAtError && (
            <p className="text-xs text-destructive pl-1">{publishAtError}</p>
          )}
          <p className="text-xs text-muted-foreground pl-1">
            Time is in your local timezone and will be converted to UTC
          </p>
        </div>
      )}
    </div>
  );
};
