"use client";

import type { ReactNode } from "react";

/** Shared Apple-style studio tokens (Final Cut / Motion pro-app language) */
export const studio = {
  bg: "bg-[#1c1c1e]",
  surface: "bg-[#2c2c2e]",
  elevated: "bg-[#3a3a3c]",
  separator: "border-white/[0.08]",
  text: "text-[#f5f5f7]",
  secondary: "text-[#98989d]",
  tertiary: "text-[#636366]",
  accent: "text-[#0a84ff]",
  accentBg: "bg-[#0a84ff]",
  accentRing: "ring-[#0a84ff]/40",
  radius: "rounded-[10px]",
  radiusSm: "rounded-[6px]",
} as const;

type SegmentedProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; ariaLabel?: string }[];
};

export function StudioSegmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className={`inline-flex p-0.5 ${studio.surface} ${studio.radiusSm}`}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.ariaLabel ?? option.label}
            onClick={() => onChange(option.value)}
            className={`min-w-[72px] px-3 py-1 text-[13px] font-medium transition-colors ${studio.radiusSm} ${
              selected
                ? "bg-[#636366] text-white shadow-sm"
                : `${studio.secondary} hover:text-[#f5f5f7]`
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function StudioSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className={`px-3 pb-1 pt-3 text-[11px] font-semibold ${studio.secondary}`}>
      {children}
    </p>
  );
}

export function StudioSidebarRow({
  children,
  onClick,
  selected = false,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] transition-colors ${
        selected
          ? "bg-[#0a84ff]/20 text-[#64b5ff]"
          : `${studio.text} hover:bg-white/[0.06]`
      }`}
    >
      {children}
    </button>
  );
}

export function StudioToolbarIcon({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-7 place-items-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]/50 disabled:opacity-30 ${
        active
          ? "bg-white/15 text-white"
          : `${studio.secondary} hover:bg-white/[0.08] hover:text-[#f5f5f7]`
      }`}
    >
      {children}
    </button>
  );
}

export function StudioPrimaryButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="h-[28px] rounded-[6px] bg-[#0a84ff] px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]/50"
    >
      {children}
    </button>
  );
}

export function StudioSecondaryButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`h-[28px] rounded-[6px] px-3 text-[13px] font-medium ${studio.secondary} transition-colors hover:bg-white/[0.08] hover:text-[#f5f5f7] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]/50`}
    >
      {children}
    </button>
  );
}

export function StudioGroupedPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${studio.surface} ${studio.radius} p-3 ${className}`}>
      {children}
    </div>
  );
}
