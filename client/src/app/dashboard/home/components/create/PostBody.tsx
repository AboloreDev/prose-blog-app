interface PostBodyInputProps {
  value: string;
  onChange: (val: string) => void;
}

export const PostBodyInput = ({ value, onChange }: PostBodyInputProps) => {
  return (
    <textarea
      placeholder="Body text (optional)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      className="w-full rounded-lg bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-none focus:border-none border-none transition-all"
    />
  );
};
