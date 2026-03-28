type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleControl({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{label}</label>
      <button
        role="checkbox"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors ${value ? "bg-white" : "bg-neutral-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
          value ? "translate-x-4 bg-black" : "translate-x-0 bg-neutral-400"
        }`} />
      </button>
    </div>
  );
}
