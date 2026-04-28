"use client";

type Props = {
  id: string;
  accent?: string;
  className?: string;
};

const thumbStyle: Record<string, string> = {
  "organic-refraction": "bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.82),transparent_8%),radial-gradient(circle_at_52%_42%,rgba(103,232,249,0.62),transparent_28%),radial-gradient(circle_at_72%_58%,rgba(167,139,250,0.5),transparent_26%),linear-gradient(135deg,#05070d,#13233b_52%,#030407)]",
  "fluid-bloom": "bg-[radial-gradient(circle_at_42%_34%,rgba(255,255,255,0.76),transparent_8%),radial-gradient(circle_at_60%_55%,rgba(247,201,120,0.58),transparent_25%),radial-gradient(circle_at_35%_72%,rgba(244,114,182,0.44),transparent_24%),linear-gradient(135deg,#050403,#29190b_52%,#050407)]",
  "volumetric-veil": "bg-[radial-gradient(circle_at_46%_35%,rgba(255,255,255,0.72),transparent_9%),radial-gradient(circle_at_64%_54%,rgba(167,243,208,0.5),transparent_28%),linear-gradient(135deg,#03070a,#1d3030_52%,#050608)]",
  "iridion-flow": "bg-[radial-gradient(circle_at_38%_30%,rgba(255,255,255,0.72),transparent_8%),radial-gradient(circle_at_58%_56%,rgba(196,181,253,0.54),transparent_30%),radial-gradient(circle_at_72%_45%,rgba(56,189,248,0.28),transparent_22%),linear-gradient(135deg,#030407,#17142d_55%,#05070b)]",
  "neural-foam": "bg-[radial-gradient(circle_at_48%_38%,rgba(255,255,255,0.76),transparent_7%),radial-gradient(circle_at_30%_58%,rgba(253,164,175,0.5),transparent_22%),radial-gradient(circle_at_70%_62%,rgba(247,201,120,0.36),transparent_24%),linear-gradient(135deg,#070304,#23111a_55%,#060506)]",
  "lava-lamp": "bg-[radial-gradient(circle_at_45%_34%,rgba(255,255,255,0.72),transparent_8%),radial-gradient(circle_at_55%_58%,rgba(251,146,60,0.68),transparent_25%),radial-gradient(circle_at_32%_70%,rgba(239,68,68,0.42),transparent_22%),linear-gradient(135deg,#090403,#301306_55%,#080303)]",
  "bio-lattice": "bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.66),transparent_7%),radial-gradient(circle_at_58%_55%,rgba(140,248,210,0.48),transparent_30%),radial-gradient(circle_at_75%_68%,rgba(247,201,120,0.22),transparent_20%),linear-gradient(135deg,#020705,#0b2520_55%,#030504)]",
  "oil-water": "bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.74),transparent_8%),radial-gradient(circle_at_60%_52%,rgba(147,197,253,0.55),transparent_28%),radial-gradient(circle_at_72%_64%,rgba(216,180,254,0.36),transparent_20%),linear-gradient(135deg,#02040a,#142438_55%,#030407)]",
};

export function TextureThumb({ id, accent = "#67e8f9", className = "" }: Props) {
  return (
    <span className={`relative block overflow-hidden ${thumbStyle[id] ?? thumbStyle["organic-refraction"]} ${className}`}>
      <span className="absolute inset-0 opacity-70 [background-image:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.12)_45%,transparent_46%),radial-gradient(circle,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:100%_100%,18px_18px]" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
      <span className="absolute left-2 top-2 size-1.5" style={{ backgroundColor: accent }} />
    </span>
  );
}
