type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectControl({ label, options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[13px] font-semibold text-ergon-text uppercase tracking-[0.08em]">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3.5 py-2 text-[13px] rounded-md transition-all duration-150 cursor-pointer ${
              value === option
                ? "bg-ergon-text text-white font-semibold"
                : "bg-ergon-surface text-ergon-subtle font-medium hover:bg-ergon-border hover:text-ergon-text"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
