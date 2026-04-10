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

// Each template gets a natural aspect ratio — tailored to the art style
const TEMPLATE_ASPECTS: Record<string, string> = {
  drift: "16/10",
  grid: "1/1",
  pulse: "4/3",
  scatter: "3/2",
  weave: "1/1",
  flowfield: "16/9",
  particles: "3/2",
  spiral: "1/1",
  aurora: "16/9",
  waves: "16/10",
  marble: "4/3",
  bloom: "3/4",
  glyphs: "4/5",
  constellation: "16/9",
  terrain: "16/10",
  contour: "3/2",
  glitch: "16/9",
  mesh: "1/1",
  sculpt: "4/3",
  fluid: "16/9",
  organism: "3/4",
  terrain3d: "16/10",
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
  const aspect = TEMPLATE_ASPECTS[templateId] || "3/2";
  return {
    aspectRatio: aspect,
    background: `radial-gradient(circle at ${ox}% ${oy}%, ${palette[2]}20 0%, transparent 50%), linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
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
      {/* Header */}
      <header className="px-16 pt-12 pb-20 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-ergon-text tracking-[-0.01em]">
            Ergon
          </h1>
        </div>
        <Link
          href="/studio"
          className="text-xs text-ergon-muted hover:text-ergon-text transition-colors"
        >
          Open Studio
        </Link>
      </header>

      {/* Gallery — 2 columns, 124px gap */}
      <main className="px-16 pb-24">
        {works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "124px" }}>
            {works.map((work: Record<string, unknown>) => {
              const year = new Date(work.created_at as string).getFullYear();
              return (
                <Link
                  key={work.id as string}
                  href={`/work/${work.slug}`}
                  className="group block"
                >
                  {/* Art — no rounding, no border, natural aspect ratio */}
                  <div
                    className="w-full overflow-hidden transition-opacity duration-300 group-hover:opacity-90"
                    style={getCardStyle(work.template_id as string, work.title as string)}
                  />
                  {/* Info bar — title left, attribution right */}
                  <div className="flex items-baseline justify-between mt-4">
                    <h3 className="text-sm font-medium text-ergon-text">
                      {work.title as string}
                    </h3>
                    <span className="text-[11px] text-ergon-muted tracking-wide">
                      litt.works{" "}{year}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-sm text-ergon-muted mb-6">No works published yet.</p>
            <Link
              href="/studio"
              className="text-xs text-ergon-muted hover:text-ergon-text transition-colors"
            >
              Start Creating
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-16 py-8">
        <p className="text-[10px] text-ergon-muted/20 tracking-[0.08em]">
          litt.works
        </p>
      </footer>
    </div>
  );
}
