"use client";

import { useActionState } from "react";
import { signup, type AuthResult } from "@/lib/actions/auth";
import Link from "next/link";

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthResult | undefined, FormData>(
    async (_prev, formData) => signup(formData),
    undefined
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-[11px] font-bold text-ergon-text uppercase tracking-[0.25em] mb-10">
          Ergon
        </h1>
        <h2 className="text-[13px] font-semibold text-ergon-text uppercase tracking-[0.15em] mb-6">
          Create Account
        </h2>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">Username</label>
            <input name="username" type="text" required pattern="[a-z0-9_-]+" minLength={3} maxLength={20} className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors font-mono" placeholder="your-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">Email</label>
            <input name="email" type="email" required className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors" placeholder="you@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">Password</label>
            <input name="password" type="password" required minLength={8} className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors" />
          </div>
          {state?.error && <p className="text-[11px] text-ergon-red">{state.error}</p>}
          <button type="submit" disabled={pending} className="w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] bg-ergon-text text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
            {pending ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="text-[11px] text-ergon-muted mt-6 text-center">
          Already have an account?{" "}<Link href="/login" className="text-ergon-text underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
