"use client";

import { useActionState } from "react";
import { login, type AuthResult } from "@/lib/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthResult | undefined, FormData>(
    async (_prev, formData) => login(formData),
    undefined
  );

  return (
    <div className="min-h-dvh bg-ergon-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-[11px] font-bold text-ergon-text uppercase tracking-[0.25em] mb-10">
          Ergon
        </h1>
        <h2 className="text-balance text-[13px] font-semibold text-ergon-text uppercase tracking-[0.15em] mb-6">
          Sign In
        </h2>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ergon-accent/60 focus-visible:border-ergon-accent/60"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ergon-accent/60 focus-visible:border-ergon-accent/60"
            />
          </div>
          {state?.error && (
            <p role="alert" className="text-[11px] text-ergon-red">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] bg-ergon-text text-ergon-bg rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ergon-accent/60"
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-pretty text-[11px] text-ergon-muted mt-6 text-center">
          No account?{" "}
          <Link href="/signup" className="text-ergon-text underline underline-offset-2">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
