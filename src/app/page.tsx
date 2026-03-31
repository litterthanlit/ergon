import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

// Curated color palettes per template — feel generative, not generic
const TEMPLATE_PALETTES: Record<string, [string, string, string]> = {
  drift: ["#0a0a2e", "#1a1a4e", "#e8b931"],
  grid: ["#1a1a1a", "#c4362c", "#f5f5f0"],
  pulse: ["#1a0a2e", "#4a1a5e", "#e8b931"],
  scatter: ["#f0e6d8", "#e8c4a0", "#c4362c"],
  weave: ["#2d3a1a", "#5a6b3a", "#dda15e"],
  flowfield: ["#0a2a2a", "#1a4a4a", "#00ff88"],
  particles: ["#2a1a0a", "#5a3a1a", "#ff6b35"],
  spiral: ["#1a0a3a", "#3a1a6a", "#61afef"],
  aurora: ["#0a1a2a", "#00ff88", "#8800ff"],
  waves: ["#0a1628", "#1a3a5a", "#90e0ef"],
  marble: ["#3a2a1a", "#6a5a4a", "#d4c4b0"],
  bloom: ["#2a0a1a", "#5a1a3a", "#ff69b4"],
  glyphs: ["#0a0a0a", "#1a1a1a", "#e8b931"],
  constellation: ["#050510", "#1a1a3a", "#ffffff"],
  terrain: ["#1a2a1a", "#3a5a3a", "#8ab661"],
  contour: ["#f5f5f0", "#ddd9d0", "#0a1628"],
  glitch: ["#0a0a0a", "#ff0080", "#00ff80"],
  mesh: ["#1a1a2a", "#3a3a5a", "#7a7aff"],
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
  const palette = TEMPLATE_PALETTES[templateId] || ["#1a1a2a", "#2a2a4a", "#e8b931"];
  const hash = hashString(title || "untitled");
  const angle = (hash % 360);
  const offsetX = (hash % 40) + 30;
  const offsetY = ((hash >> 4) % 40) + 30;

  return {
    background: `
      radial-gradient(circle at ${offsetX}% ${offsetY}%, ${palette[2]}22 0%, transparent 50%),
      linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 100%)
    `,
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
    <div className="min-h-screen bg-ergon-surface">
      {/* Header */}
      <header className="px-10 pt-12 pb-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-ergon-text uppercase tracking-[0.15em] leading-none">
            Ergon
          </h1>
          <p className="text-sm text-ergon-muted mt-2 tracking-[0.05em] font-medium">
            A studio for generative art
          </p>
        </div>
        <Link
          href="/studio"
          className="px-6 py-3 text-sm font-semibold text-white bg-ergon-text rounded-xl hover:opacity-90 transition-opacity shrink-0"
        >
          Open Studio
        </Link>
      </header>

      {/* Gallery */}
      <main className="px-10 pb-20">
        {works.length > 0 ? (
          <>
            <div className="mb-10">
              <h2 className="text-[11px] font-bold text-ergon-muted uppercase tracking-[0.2em]">
                Published Works
              </h2>
              <div className="w-12 h-0.5 bg-ergon-accent mt-3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {works.map((work: Record<string, unknown>) => (
                <Link
                  key={work.id as string}
                  href={`/work/${work.slug}`}
                  className="group block"
                >
                  <div
                    className="aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] group-hover:-translate-y-1"
                    style={getCardStyle(work.template_id as string, work.title as string)}
                  >
                    {/* Subtle noise/texture overlay */}
                    <div className="w-full h-full" style={{
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
                      backgroundSize: "200px 200px",
                    }} />
                  </div>
                  <div className="mt-4 px-0.5">
                    <h3 className="text-base font-bold text-ergon-text group-hover:text-ergon-accent transition-colors duration-200">
                      {work.title as string}
                    </h3>
                    <p className="text-sm text-ergon-muted mt-1">
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
          <div className="flex flex-col items-center justify-center py-32">
            <h2 className="text-3xl font-bold text-ergon-text uppercase tracking-[0.1em] mb-4">
              No works yet
            </h2>
            <p className="text-base text-ergon-muted mb-10 max-w-md text-center leading-relaxed">
              Ergon is a studio for generative art. Create your first piece and publish it to see it here.
            </p>
            <Link
              href="/studio"
              className="px-8 py-4 text-sm font-semibold text-white bg-ergon-text rounded-xl hover:opacity-90 transition-opacity"
            >
              Start Creating
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-10 py-8 border-t border-ergon-border">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-ergon-muted/40 uppercase tracking-[0.2em] font-medium">
            Ergon — Generative Art Studio
          </p>
          <p className="text-[10px] text-ergon-muted/30 uppercase tracking-[0.15em]">
            Made for artists who code
          </p>
        </div>
      </footer>
    </div>
  );
}
