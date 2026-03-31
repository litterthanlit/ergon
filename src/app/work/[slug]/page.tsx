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
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Minimal top bar — fades on hover */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-black/40 to-transparent">
        <Link
          href="/"
          className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] hover:text-white transition-colors"
        >
          Ergon
        </Link>
        <Link
          href="/studio"
          className="text-xs font-medium text-white/50 uppercase tracking-[0.1em] hover:text-white transition-colors"
        >
          Open Studio
        </Link>
      </div>

      {/* Canvas — full bleed */}
      <div className="flex-1 relative">
        <iframe
          title={work.title}
          src={sandboxUrl}
          sandbox="allow-scripts"
          className="absolute inset-0 w-full h-full border-0"
          style={{ background: "#000" }}
        />
      </div>

      {/* Bottom info bar — minimal metadata */}
      <div className="bg-black px-8 py-5 flex items-end justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            {work.title}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            {artistUsername ? (
              <Link
                href={`/artist/${artistUsername}`}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {artistName}
              </Link>
            ) : (
              <span className="text-sm text-white/50">{artistName}</span>
            )}
            <span className="text-white/20">·</span>
            <span className="text-sm text-white/30">{createdDate}</span>
          </div>
        </div>
        <div className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-medium">
          Made with Ergon
        </div>
      </div>
    </div>
  );
}
