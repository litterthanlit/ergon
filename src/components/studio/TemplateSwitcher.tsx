import { templates } from "@/lib/templates/registry";

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function TemplateSwitcher({ activeId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-neutral-950/80 backdrop-blur-sm border-t border-neutral-900">
      <span className="text-[9px] text-neutral-600 uppercase tracking-[0.15em] font-medium mr-2 shrink-0">
        Templates
      </span>
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-2.5 py-1 text-[11px] rounded transition-all duration-150 shrink-0 ${
            activeId === t.id
              ? "bg-neutral-800 text-white font-medium"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
