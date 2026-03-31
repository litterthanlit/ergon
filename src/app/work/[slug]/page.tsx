import { getPublishedWork } from "@/lib/actions/works";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const { work, error } = await getPublishedWork(slug);

  if (error || !work) {
    notFound();
  }

  const encodedCode = encodeURIComponent(work.code);
  const encodedParams = encodeURIComponent(JSON.stringify(work.params ?? {}));

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 h-10 border-b border-ergon-border shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[10px] font-bold text-ergon-text uppercase tracking-[0.25em] hover:opacity-70 transition-opacity">
            Ergon
          </Link>
          <span className="text-[10px] text-ergon-muted">/</span>
          <span className="text-[11px] font-medium text-ergon-text">{work.title}</span>
        </div>
        <Link href={`/artist/${work.profiles.username}`} className="text-[10px] text-ergon-muted hover:text-ergon-text transition-colors uppercase tracking-[0.12em]">
          by {work.profiles.display_name || work.profiles.username}
        </Link>
      </div>
      <div className="flex-1 bg-ergon-surface">
        <iframe
          title={work.title}
          src={`/sandbox/index.html#code=${encodedCode}&params=${encodedParams}`}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          style={{ background: "#fafafa" }}
        />
      </div>
    </div>
  );
}
