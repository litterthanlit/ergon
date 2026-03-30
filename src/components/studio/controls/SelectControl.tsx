type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectControl({ label, options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-2.5 py-1 text-[11px] rounded transition-all duration-150 ${
              value === option
                ? "bg-ergon-text text-white font-medium"
                : "bg-ergon-surface text-ergon-subtle hover:bg-ergon-border hover:text-ergon-text"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
