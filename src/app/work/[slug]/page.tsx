import { getPublishedWork } from "@/lib/actions/works";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { work } = await getPublishedWork(slug);
  if (!work) return { title: "Not Found — Ergon" };
  return {
    title: `${work.title} — Ergon`,
    description: `Generative artwork by ${work.profiles?.display_name || work.profiles?.username || "an artist"} on Ergon`,
    openGraph: {
      title: `${work.title} — Ergon`,
      description: `Generative art on Ergon`,
      type: "website",
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const { work } = await getPublishedWork(slug);
  if (!work) notFound();

  const codeEncoded = encodeURIComponent(work.code);
  const paramsEncoded = work.params
    ? encodeURIComponent(JSON.stringify(work.params))
    : "";
  const sandboxUrl = `/sandbox/index.html#code=${codeEncoded}${paramsEncoded ? `&params=${paramsEncoded}` : ""}`;

  const artistName = work.profiles?.display_name || work.profiles?.username || "Anonymous";
  const artistUsername = work.profiles?.username;
  const createdDate = new Date(work.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden" style={{ viewTransitionName: "work-page" }}>
      {/* Top chrome — visible on hover */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 py-5 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-black/60 to-transparent">
        <Link
          href="/"
          className="text-[11px] font-bold text-white/60 uppercase tracking-[0.25em] hover:text-white transition-colors"
        >
          Ergon
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/studio"
            className="text-[11px] font-medium text-white/40 uppercase tracking-[0.12em] hover:text-white transition-colors"
          >
            Open Studio
          </Link>
        </div>
      </div>

      {/* Full-bleed canvas */}
      <div className="flex-1 relative" style={{ viewTransitionName: "work-canvas" }}>
        <iframe
          title={work.title}
          src={sandboxUrl}
          sandbox="allow-scripts"
          className="absolute inset-0 w-full h-full border-0"
          style={{ background: "#000" }}
        />
      </div>

      {/* Bottom info — always visible, minimal */}
      <div className="bg-black/90 backdrop-blur-sm px-10 py-6 flex items-end justify-between border-t border-white/5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-[0.02em]" style={{ viewTransitionName: "work-title" }}>
            {work.title}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            {artistUsername ? (
              <Link
                href={`/artist/${artistUsername}`}
                className="text-sm text-white/40 hover:text-white transition-colors duration-300"
              >
                {artistName}
              </Link>
            ) : (
              <span className="text-sm text-white/40">{artistName}</span>
            )}
            <span className="text-white/15 text-xs">·</span>
            <span className="text-sm text-white/25">{createdDate}</span>
          </div>
        </div>
        <span className="text-[9px] text-white/15 uppercase tracking-[0.2em] font-semibold">
          Made with Ergon
        </span>
      </div>
    </div>
  );
}
