type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectControl({ label, options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ergon-subtle">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full border px-3.5 py-2 text-[12px] transition-all duration-150 cursor-pointer ${
              value === option
                ? "border-ergon-text bg-ergon-text text-white shadow-[0_8px_18px_rgba(10,22,40,0.08)]"
                : "border-ergon-border/90 bg-white text-ergon-subtle hover:border-ergon-muted hover:text-ergon-text hover:bg-ergon-surface/80"
            }`}
            aria-pressed={value === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
