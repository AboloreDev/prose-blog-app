const MAX = 300;

interface PostTitleInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export const PostTitleInput = ({
  value,
  onChange,
  error,
}: PostTitleInputProps) => {
  return (
    <div className="space-y-1 bg-white border-none">
      <div className="relative">
        <input
          type="text"
          placeholder="Title *"
          maxLength={MAX}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input px-3 py-2.5 text-sm pr-16 focus:outline-none focus:ring-none focus:border-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {value.length}/{MAX}
        </span>
      </div>
    </div>
  );
};
