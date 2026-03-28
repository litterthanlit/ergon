type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectControl({ label, options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.12em]">
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-2 py-1 text-[11px] rounded transition-all duration-150 ${
              value === option
                ? "bg-white text-neutral-950 font-medium"
                : "bg-neutral-800/60 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
