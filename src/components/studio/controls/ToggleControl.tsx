type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
        {label}
      </label>
      <button
        role="checkbox"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-8 h-[18px] rounded-full transition-colors duration-150 ${
          value ? "bg-ergon-text" : "bg-ergon-border"
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full transition-transform duration-150 ${
            value ? "translate-x-[14px] bg-white" : "translate-x-0 bg-ergon-muted"
          }`}
        />
      </button>
    </div>
  );
}
