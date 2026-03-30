type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-medium text-ergon-subtle uppercase tracking-[0.12em]">
        {label}
      </label>
      <input
        type="color" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-ergon-border cursor-pointer bg-transparent"
      />
    </div>
  );
}
