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
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
          {label}
        </label>
        <span className="text-[10px] text-ergon-text font-mono tabular-nums">
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
      />
    </div>
  );
}
