import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

const TEMPLATE_PALETTES: Record<string, [string, string, string]> = {
  drift: ["#0a0a2e", "#1a1a4e", "#e8b931"],
  grid: ["#1a1a1a", "#c4362c", "#f5f5f0"],
  pulse: ["#1a0a2e", "#4a1a5e", "#e8b931"],
  scatter: ["#2a1a1a", "#4a2a2a", "#c4362c"],
  weave: ["#1a2a1a", "#2a4a2a", "#dda15e"],
  flowfield: ["#0a2a2a", "#1a4a4a", "#00ff88"],
  particles: ["#2a1a0a", "#4a2a1a", "#ff6b35"],
  spiral: ["#1a0a3a", "#3a1a6a", "#61afef"],
  aurora: ["#0a1a2a", "#00ff88", "#8800ff"],
  waves: ["#0a1628", "#1a3a5a", "#90e0ef"],
  marble: ["#2a2018", "#4a3828", "#d4c4b0"],
  bloom: ["#2a0a1a", "#4a1a3a", "#ff69b4"],
  glyphs: ["#0a0a0a", "#1a1a1a", "#e8b931"],
  constellation: ["#050510", "#0a0a20", "#ffffff"],
  terrain: ["#0a1a0a", "#1a3a1a", "#8ab661"],
  contour: ["#0a0a0a", "#1a1a1a", "#fafafa"],
  glitch: ["#0a0a0a", "#ff0080", "#00ff80"],
  mesh: ["#0a0a1a", "#1a1a3a", "#7a7aff"],
  sculpt: ["#1a1018", "#2a1a28", "#e8b931"],
  fluid: ["#0a1020", "#1a2040", "#4488ff"],
  organism: ["#0a1a1a", "#1a3a3a", "#00ffaa"],
  terrain3d: ["#1a1a0a", "#2a2a1a", "#8ab661"],
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCardStyle(templateId: string, title: string): React.CSSProperties {
  const palette = TEMPLATE_PALETTES[templateId] || ["#111", "#1a1a1a", "#e8b931"];
  const hash = hashString(title || "untitled");
  const angle = hash % 360;
  const ox = (hash % 40) + 30;
  const oy = ((hash >> 4) % 40) + 30;
  return {
    background: `radial-gradient(circle at ${ox}% ${oy}%, ${palette[2]}18 0%, transparent 50%), linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
  };
}

async function getPublishedWorks() {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("works")
      .select("id, title, slug, code, params, template_id, created_at, profiles(username, display_name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const works = await getPublishedWorks();

  return (
    <div className="min-h-screen bg-ergon-bg">
      <header className="px-8 pt-10 pb-14 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ergon-text tracking-[-0.02em]">
            Ergon
          </h1>
          <p className="text-xs text-ergon-muted mt-1 tracking-wide">
            Generative art studio
          </p>
        </div>
        <Link
          href="/studio"
          className="px-4 py-2 text-xs font-medium text-ergon-text bg-ergon-elevated border border-ergon-border rounded-lg hover:bg-ergon-border/50 transition-colors"
        >
          Open Studio
        </Link>
      </header>

      <main className="px-8 pb-16">
        {works.length > 0 ? (
          <>
            <div className="mb-8">
              <span className="text-[10px] font-medium text-ergon-muted uppercase tracking-[0.15em]">
                Published
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {works.map((work: Record<string, unknown>) => (
                <Link key={work.id as string} href={`/work/${work.slug}`} className="group block">
                  <div
                    className="aspect-[4/3] rounded-lg overflow-hidden border border-ergon-border/50 transition-all duration-200 group-hover:border-ergon-border group-hover:-translate-y-0.5"
                    style={getCardStyle(work.template_id as string, work.title as string)}
                  />
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-ergon-text group-hover:text-ergon-accent transition-colors">
                      {work.title as string}
                    </h3>
                    <p className="text-xs text-ergon-muted mt-0.5">
                      {(work.profiles as Record<string, string>)?.display_name ||
                       (work.profiles as Record<string, string>)?.username ||
                       "Anonymous"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-28">
            <p className="text-sm text-ergon-muted mb-6">No works published yet.</p>
            <Link
              href="/studio"
              className="px-5 py-2.5 text-xs font-medium text-ergon-text bg-ergon-elevated border border-ergon-border rounded-lg hover:bg-ergon-border/50 transition-colors"
            >
              Start Creating
            </Link>
          </div>
        )}
      </main>

      <footer className="px-8 py-6 border-t border-ergon-border/50">
        <p className="text-[10px] text-ergon-muted/30 tracking-[0.1em]">
          Ergon
        </p>
      </footer>
    </div>
  );
}
