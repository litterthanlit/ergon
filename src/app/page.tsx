import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

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
      <header className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-ergon-text uppercase tracking-[0.2em]">
            Ergon
          </h1>
          <p className="text-xs text-ergon-muted mt-0.5 tracking-wide">
            Generative Art Studio
          </p>
        </div>
        <Link
          href="/studio"
          className="px-5 py-2.5 text-sm font-semibold text-white bg-ergon-text rounded-xl hover:opacity-90 transition-opacity"
        >
          Open Studio
        </Link>
      </header>

      {/* Gallery Grid */}
      <main className="px-8 pb-16">
        {works.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-ergon-muted uppercase tracking-[0.15em]">
                Published Works
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work: Record<string, unknown>) => (
                <Link
                  key={work.id as string}
                  href={`/work/${work.slug}`}
                  className="group block"
                >
                  <div className="aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] group-hover:-translate-y-0.5">
                    {/* Canvas preview placeholder — shows template name as visual */}
                    <div className="w-full h-full flex items-center justify-center bg-ergon-text/[0.03]">
                      <span className="text-3xl font-bold text-ergon-text/10 uppercase tracking-[0.15em]">
                        {(work.template_id as string || "art").slice(0, 6)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 px-1">
                    <h3 className="text-sm font-semibold text-ergon-text group-hover:text-ergon-accent transition-colors">
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
          /* Empty state — inviting, not sad */
          <div className="flex flex-col items-center justify-center py-32">
            <h2 className="text-2xl font-bold text-ergon-text uppercase tracking-[0.1em] mb-3">
              No works yet
            </h2>
            <p className="text-sm text-ergon-muted mb-8 max-w-md text-center leading-relaxed">
              Ergon is a studio for generative art. Create your first piece and publish it to see it here.
            </p>
            <Link
              href="/studio"
              className="px-6 py-3 text-sm font-semibold text-white bg-ergon-text rounded-xl hover:opacity-90 transition-opacity"
            >
              Start Creating
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-ergon-border">
        <p className="text-xs text-ergon-muted/50 uppercase tracking-[0.15em]">
          Ergon — Generative Art Studio
        </p>
      </footer>
    </div>
  );
}
