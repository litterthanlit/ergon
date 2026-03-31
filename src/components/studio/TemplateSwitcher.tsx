import { templates } from "@/lib/templates/registry";

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function TemplateSwitcher({ activeId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/90 backdrop-blur-md border-t border-ergon-border">
      <span className="text-xs text-ergon-muted uppercase tracking-[0.1em] font-medium mr-2 shrink-0">
        Templates
      </span>
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-3 py-1.5 text-sm rounded-md transition-all duration-150 shrink-0 ${
            activeId === t.id
              ? "bg-ergon-text text-white font-medium"
              : "text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
