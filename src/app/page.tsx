import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

type WorkCard = {
  id: string;
  title: string;
  slug: string;
  template_id: string | null;
  thumbnail_url: string | null;
  profiles?: {
    username?: string;
    display_name?: string;
  } | null;
};

async function getPublishedWorks(): Promise<WorkCard[]> {
  try {
    const supabase = await createServerSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from("works")
      .select("id, title, slug, template_id, thumbnail_url, profiles(username, display_name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6);
    return (data ?? []) as WorkCard[];
  } catch {
    return [];
  }
}

const exampleSystems = [
  ["Curl Noise TOP", "Organic source", "#67e8f9"],
  ["Fluid Advection TOP", "Liquid motion", "#a78bfa"],
  ["Raymarch Glass TOP", "Refractive depth", "#e0f2fe"],
  ["Bloom TOP", "Cinematic light", "#fde68a"],
  ["Color Grade TOP", "Editorial finish", "#c4b5fd"],
  ["Out TOP", "Live canvas", "#86efac"],
] as const;

export default async function HomePage() {
  const works = await getPublishedWorks();

  return (
    <main className="min-h-dvh overflow-y-auto bg-[#050609] text-zinc-100">
      <section className="relative min-h-dvh overflow-hidden px-5 py-5 md:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.12),transparent_34%),linear-gradient(300deg,rgba(167,139,250,0.12),transparent_36%)]" />
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-40px)] max-w-7xl flex-col">
          <header className="flex items-center justify-between border-b border-white/10 py-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/8 font-mono text-xs">
                E
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.16em]">Ergon</span>
                <span className="block text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  organic TOP lab
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/login" className="hidden px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200 sm:block">
                Sign in
              </Link>
              <Link
                href="/studio"
                className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition-transform hover:scale-[1.02]"
              >
                Open Studio
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                Reference-grade organic visual systems
              </p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[0.95] text-zinc-50 md:text-7xl">
                Build luminous generative visuals from real texture operators.
              </h1>
              <p className="mt-6 text-pretty text-lg leading-8 text-zinc-400">
                Ergon is a cinematic TOP studio for visual artists: curl noise, fluid advection,
                glass refraction, bloom, color grade, and export-ready GPU output in one live canvas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/studio"
                  className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition-transform hover:scale-[1.02]"
                >
                  Open Studio
                </Link>
                <a
                  href="#systems"
                  className="rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/8"
                >
                  View systems
                </a>
              </div>
            </div>

            <div className="border border-white/10 bg-black/60 p-3 shadow-2xl shadow-black/40">
              <div className="grid min-h-[560px] overflow-hidden border border-white/10 bg-[#08090d] lg:grid-cols-[0.92fr_1.08fr]">
                <div className="relative overflow-hidden border-b border-white/10 bg-black lg:border-b-0 lg:border-r">
                  <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_45%,rgba(2,6,23,1),rgba(56,189,248,0.34),rgba(167,139,250,0.26),rgba(247,201,120,0.18),rgba(2,6,23,1))]" />
                  <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.09)_42%,transparent_43%),radial-gradient(circle,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:100%_100%,38px_38px]" />
                  <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] text-zinc-300 backdrop-blur-md">
                    Live output · liquid aurora
                  </div>
                </div>
                <div className="relative p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Patch graph
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] text-zinc-400">
                      8s loop
                    </span>
                  </div>
                  <div className="space-y-4">
                    {exampleSystems.map(([kind, label, color], index) => (
                      <div key={kind} className="relative">
                        {index < exampleSystems.length - 1 && (
                          <div className="absolute left-5 top-11 h-8 w-px bg-white/12" />
                        )}
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 p-3">
                          <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="min-w-20 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                            {kind}
                          </span>
                          <span className="text-sm font-medium text-zinc-200">{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                      <span>Timeline</span>
                      <span>01.60s</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/10">
                      <div className="absolute left-[20%] top-1/2 size-3 -translate-y-1/2 rotate-45 rounded-[3px] bg-sky-300" />
                      <div className="absolute left-[50%] top-1/2 size-3 -translate-y-1/2 rotate-45 rounded-[3px] bg-sky-300" />
                      <div className="absolute bottom-[-12px] left-[20%] top-[-12px] w-px bg-zinc-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="systems" className="border-t border-white/10 px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-50">Recent visual systems</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Published work stays part of the product, but the studio is now the center of gravity.
              </p>
            </div>
            <Link href="/studio" className="hidden rounded-full border border-white/12 px-4 py-2 text-sm text-zinc-300 hover:bg-white/8 md:block">
              Build your own
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(works.length ? works : [
              { id: "demo-1", title: "Cinematic Field", slug: "demo-1", template_id: "flowfield", thumbnail_url: null },
              { id: "demo-2", title: "Aurora Memory", slug: "demo-2", template_id: "aurora", thumbnail_url: null },
              { id: "demo-3", title: "Soft Feedback", slug: "demo-3", template_id: "drift", thumbnail_url: null },
            ]).map((work, index) => (
              <Link
                key={work.id}
                href={works.length ? `/work/${work.slug}` : "/studio"}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-3 transition-colors hover:bg-white/[0.06]"
              >
                {work.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={work.thumbnail_url}
                    alt={`${work.title} preview`}
                    className="aspect-[4/3] w-full rounded-2xl bg-black object-cover"
                  />
                ) : (
                  <div className="aspect-[4/3] rounded-2xl bg-black [background-image:radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.28),transparent_28%),radial-gradient(circle_at_70%_60%,rgba(244,114,182,0.22),transparent_26%)]" />
                )}
                <div className="px-1 pt-4">
                  <h3 className="font-semibold text-zinc-100">{work.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {work.profiles?.display_name ?? work.profiles?.username ?? `System ${index + 1}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
