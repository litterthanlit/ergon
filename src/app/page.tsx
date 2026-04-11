import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-screen w-screen bg-ergon-bg flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 shrink-0">
        <span className="text-[13px] font-medium text-ergon-text">
          Ergon
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/studio"
            className="text-[13px] text-ergon-muted hover:text-ergon-text transition-colors"
          >
            Studio
          </Link>
          <Link
            href="/login"
            className="text-[13px] text-ergon-muted hover:text-ergon-text transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero — centered, typographic */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-medium text-ergon-text leading-[1.08] tracking-[-0.035em]">
            Generative art,
            <br />
            shaped by hand.
          </h1>
          <p className="mt-5 text-base text-ergon-muted leading-relaxed max-w-md mx-auto">
            A studio for creating, composing, and publishing
            generative artwork. No code required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/create"
              className="px-5 h-10 inline-flex items-center text-[13px] font-medium text-ergon-bg bg-ergon-text rounded-lg hover:bg-ergon-subtle transition-colors"
            >
              Start Creating
            </Link>
            <Link
              href="/signup"
              className="px-5 h-10 inline-flex items-center text-[13px] font-medium text-ergon-subtle border border-ergon-border rounded-lg hover:text-ergon-text hover:border-ergon-muted transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Subtle feature list */}
        <div className="mt-32 flex items-center gap-12">
          {["3D sculpting", "Composition layers", "Shared drivers", "One-click publish"].map((feature, i) => (
            <span key={feature} className="text-[11px] text-ergon-muted/40 tracking-wide flex items-center gap-12">
              {i > 0 && <span className="text-ergon-border">·</span>}
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-ergon-muted/30">
          Ergon
        </span>
        <span className="text-[11px] text-ergon-muted/20">
          Built for artists
        </span>
      </div>
    </div>
  );
}
