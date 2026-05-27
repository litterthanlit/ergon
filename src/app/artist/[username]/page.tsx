import { getArtistWorks } from "@/lib/actions/works";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ArtistPage({ params }: Props) {
  const { username } = await params;
  const { profile, works, error } = await getArtistWorks(username);

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-ergon-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/" className="text-[10px] font-bold text-ergon-muted uppercase tracking-[0.25em] hover:text-ergon-text transition-colors">
            Ergon
          </Link>
          <h1 className="text-[22px] font-bold text-ergon-text mt-6">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-[12px] text-ergon-muted font-mono mt-1">@{profile.username}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {works && works.length > 0 ? (
          <>
            <h2 className="text-[10px] font-semibold text-ergon-subtle uppercase tracking-[0.18em] mb-6">Published Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((work) => (
                <Link key={work.id} href={`/work/${work.slug}`} className="group border border-ergon-border rounded hover:border-ergon-text transition-colors">
                  {work.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={work.thumbnail_url}
                      alt={`${work.title} preview`}
                      className="aspect-[4/3] w-full rounded-t bg-ergon-surface object-cover"
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-ergon-surface rounded-t" />
                  )}
                  <div className="px-4 py-3 border-t border-ergon-border">
                    <h3 className="text-[12px] font-medium text-ergon-text group-hover:text-ergon-red transition-colors">{work.title}</h3>
                    <p className="text-[10px] text-ergon-muted mt-1 font-mono">
                      {new Date(work.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-ergon-muted text-center py-12">No published works yet.</p>
        )}
      </div>
    </div>
  );
}
