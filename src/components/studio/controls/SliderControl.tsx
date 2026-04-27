type Props = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
};

export function SliderControl({ label, min, max, step = 1, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ergon-subtle">
          {label}
        </label>
        <span className="rounded-full bg-ergon-surface px-2.5 py-1 text-[11px] font-mono tabular-nums text-ergon-muted">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
