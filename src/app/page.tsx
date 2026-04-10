import Link from "next/link";
import Image from "next/image";

// litt.works pieces — each with its natural metadata
const pieces = [
  { slug: "unfiltered-projections", title: "Unfiltered Projections", file: "unfiltered projections.jpg", year: 2024 },
  { slug: "chaos", title: "Chaos", file: "chaos.jpg", year: 2024 },
  { slug: "in-the-fire", title: "In the Fire", file: "in the fire.jpg", year: 2024 },
  { slug: "shattered", title: "Shattered", file: "shattered.jpg", year: 2024 },
  { slug: "emptiness-surrounding-me", title: "Emptiness Surrounding Me", file: "emptiness surrounding me.jpg", year: 2024 },
  { slug: "untld1", title: "Untld I", file: "untld1.jpg", year: 2024 },
  { slug: "untld2", title: "Untld II", file: "untld2.jpg", year: 2024 },
  { slug: "quiet-collision", title: "Quiet Collision", file: "Quiet Collision Medium.jpeg", year: 2024 },
  { slug: "blur", title: "Blur", file: "blur.jpeg", year: 2024 },
  { slug: "buzz", title: "Buzz", file: "buzz.jpeg", year: 2024 },
  { slug: "unsound-coercion", title: "Unsound Coercion", file: "unsound coercion 0 Medium.jpeg", year: 2024 },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-ergon-bg">
      {/* Header */}
      <header className="px-16 pt-12 pb-20 flex items-center justify-between">
        <h1 className="text-lg font-medium text-ergon-text tracking-[-0.01em]">
          Ergon
        </h1>
        <Link
          href="/studio"
          className="text-xs text-ergon-muted hover:text-ergon-text transition-colors"
        >
          Open Studio
        </Link>
      </header>

      {/* Gallery — 2 columns, 124px gap */}
      <main className="px-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "124px" }}>
          {pieces.map((piece) => (
            <div key={piece.slug} className="group">
              {/* Art — no rounding, no border, natural aspect ratio from image */}
              <div className="relative w-full overflow-hidden">
                <Image
                  src={`/art/pieces/${piece.file}`}
                  alt={piece.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain transition-opacity duration-300 group-hover:opacity-90"
                  sizes="(max-width: 768px) 100vw, 45vw"
                  priority={pieces.indexOf(piece) < 4}
                />
              </div>
              {/* Info — title left, attribution right */}
              <div className="flex items-baseline justify-between mt-4">
                <h3 className="text-sm font-medium text-ergon-text">
                  {piece.title}
                </h3>
                <span className="text-[11px] text-ergon-muted tracking-wide shrink-0 ml-4">
                  litt.works  {piece.year}
                </span>
              </div>
            </div>
          ))}
        </div>
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
