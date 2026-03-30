type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-ergon-subtle uppercase tracking-[0.12em]">
        {label}
      </label>
      <button
        role="checkbox"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
          value ? "bg-ergon-text" : "bg-ergon-border"
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full transition-transform duration-150 ${
            value ? "translate-x-[16px] bg-white" : "translate-x-0 bg-ergon-muted"
          }`}
        />
      </button>
    </div>
  );
}
