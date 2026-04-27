type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ergon-subtle">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-xl border border-ergon-border/90 bg-transparent"
          aria-label={label}
        />
        <span className="min-w-[4.75rem] rounded-full bg-ergon-surface px-2.5 py-1 text-[11px] font-mono text-ergon-muted">
          {value}
        </span>
      </div>
    </div>
  );
}
