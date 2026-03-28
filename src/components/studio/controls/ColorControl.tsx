type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{label}</label>
      <input
        type="color" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
      />
    </div>
  );
}
