# Auth + Publish + Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase auth, work saving/loading, publishing to shareable URLs, and basic artist profiles — transforming the studio from a local tool into a platform.

**Architecture:** Supabase handles auth (email/password) and database (Postgres). Server Actions handle all mutations (save, publish, login). The studio store gains save/publish state. Published works are viewable at `/work/[slug]` in a minimal viewer that renders the same sandbox iframe. Artist profiles list published works at `/artist/[username]`.

**Tech Stack:** Supabase (@supabase/supabase-js, @supabase/ssr), Next.js 16 Server Actions, existing Zustand store

**Prerequisites:** Create a Supabase project at supabase.com and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

**Database setup:** Run this SQL in the Supabase SQL editor before starting:

```sql
-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Works
create table public.works (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Untitled',
  code text not null,
  template_id text,
  params jsonb,
  is_published boolean default false,
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.works enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own works"
  on public.works for insert with check (auth.uid() = user_id);

create policy "Users can update own works"
  on public.works for update using (auth.uid() = user_id);

create policy "Users can delete own works"
  on public.works for delete using (auth.uid() = user_id);

create policy "Users can read own works"
  on public.works for select using (auth.uid() = user_id);

create policy "Published works are viewable by everyone"
  on public.works for select using (is_published = true);
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx            # CREATE — login page
│   │   └── signup/
│   │       └── page.tsx            # CREATE — signup page
│   ├── work/
│   │   └── [slug]/
│   │       └── page.tsx            # CREATE — public work viewer
│   ├── artist/
│   │   └── [username]/
│   │       └── page.tsx            # CREATE — artist profile
│   └── studio/
│       └── page.tsx                # (unchanged)
├── components/
│   └── studio/
│       ├── Studio.tsx              # MODIFY — add save/publish to toolbar area
│       └── Toolbar.tsx             # MODIFY — add Save, Publish buttons
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # CREATE — browser Supabase client
│   │   ├── server.ts              # CREATE — server Supabase client
│   │   └── types.ts               # CREATE — database types
│   ├── actions/
│   │   ├── auth.ts                # CREATE — login/signup/logout server actions
│   │   └── works.ts               # CREATE — save/load/publish server actions
│   └── store.ts                   # MODIFY — add workId, saving, publishing state
├── proxy.ts                        # CREATE — auth redirect proxy (Next.js 16)
└── __tests__/
    └── lib/
        ├── supabase-types.test.ts # CREATE
        └── actions-works.test.ts  # CREATE
```

---

### Task 1: Install Supabase and Create Client Helpers

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/types.ts`
- Create: `.env.local` (template)

- [ ] **Step 1: Install Supabase packages**

```bash
cd /Users/niki_g/conductor/workspaces/ergon/providence
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create .env.local template**

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Make sure `.env.local` is in `.gitignore` (it should be by default with Next.js).

- [ ] **Step 3: Create database types**

Create `src/lib/supabase/types.ts`:

```typescript
export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
};

export type Work = {
  id: string;
  user_id: string;
  title: string;
  code: string;
  template_id: string | null;
  params: Record<string, unknown> | null;
  is_published: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkWithProfile = Work & {
  profiles: Pick<Profile, "username" | "display_name">;
};
```

- [ ] **Step 4: Create browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 5: Create server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing sessions.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 6: Write type test**

Create `src/__tests__/lib/supabase-types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { Profile, Work, WorkWithProfile } from "@/lib/supabase/types";

describe("Supabase types", () => {
  it("Profile type has required fields", () => {
    const profile: Profile = {
      id: "uuid",
      username: "artist",
      display_name: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(profile.username).toBe("artist");
  });

  it("Work type has required fields", () => {
    const work: Work = {
      id: "uuid",
      user_id: "uuid",
      title: "Untitled",
      code: "function setup() {}",
      template_id: "drift",
      params: { density: 2000 },
      is_published: false,
      slug: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(work.title).toBe("Untitled");
    expect(work.is_published).toBe(false);
  });

  it("WorkWithProfile includes profile data", () => {
    const work: WorkWithProfile = {
      id: "uuid",
      user_id: "uuid",
      title: "My Work",
      code: "",
      template_id: null,
      params: null,
      is_published: true,
      slug: "my-work-abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      profiles: { username: "artist", display_name: "The Artist" },
    };
    expect(work.profiles.username).toBe("artist");
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run
```

Expected: All pass including new type tests.

- [ ] **Step 8: Commit**

```bash
git add src/lib/supabase/ src/__tests__/lib/supabase-types.test.ts package.json package-lock.json .env.local
git commit -m "feat: install Supabase and create client helpers and types"
```

---

### Task 2: Auth Server Actions

**Files:**
- Create: `src/lib/actions/auth.ts`

Server actions for signup, login, and logout.

- [ ] **Step 1: Create auth actions**

Create `src/lib/actions/auth.ts`:

```typescript
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthResult = {
  error?: string;
};

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createServerSupabase();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  if (!email || !password || !username) {
    return { error: "All fields are required" };
  }

  if (username.length < 3 || username.length > 20) {
    return { error: "Username must be 3-20 characters" };
  }

  if (!/^[a-z0-9_-]+$/.test(username)) {
    return { error: "Username can only contain lowercase letters, numbers, hyphens, and underscores" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/studio");
}

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createServerSupabase();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/studio");
}

export async function logout(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All pass (no test for server actions — they require Supabase).

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/auth.ts
git commit -m "feat: add auth server actions (signup, login, logout)"
```

---

### Task 3: Login and Signup Pages

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`

Minimal, Swiss-styled auth pages.

- [ ] **Step 1: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-[11px] font-bold text-ergon-text uppercase tracking-[0.25em] mb-10">
          Ergon
        </h1>

        <h2 className="text-[13px] font-semibold text-ergon-text uppercase tracking-[0.15em] mb-6">
          Sign In
        </h2>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-[11px] text-ergon-red">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] bg-ergon-text text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-[11px] text-ergon-muted mt-6 text-center">
          No account?{" "}
          <Link href="/signup" className="text-ergon-text underline underline-offset-2">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create signup page**

Create `src/app/(auth)/signup/page.tsx`:

```tsx
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
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              pattern="[a-z0-9_-]+"
              minLength={3}
              maxLength={20}
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors font-mono"
              placeholder="your-name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ergon-subtle uppercase tracking-[0.14em]">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 text-[13px] text-ergon-text bg-ergon-surface border border-ergon-border rounded focus:outline-none focus:border-ergon-text transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-[11px] text-ergon-red">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] bg-ergon-text text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {pending ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-[11px] text-ergon-muted mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-ergon-text underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build to verify pages compile**

```bash
npm run build
```

Expected: Clean build with new routes `/login`, `/signup`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add login and signup pages with Swiss editorial design"
```

---

### Task 4: Works Server Actions

**Files:**
- Create: `src/lib/actions/works.ts`

Server actions for saving, loading, publishing, and listing works.

- [ ] **Step 1: Create works actions**

Create `src/lib/actions/works.ts`:

```typescript
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Work, WorkWithProfile } from "@/lib/supabase/types";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "work"}-${suffix}`;
}

export type SaveResult = {
  id?: string;
  error?: string;
};

export async function saveWork(data: {
  id?: string;
  title: string;
  code: string;
  templateId: string | null;
  params: Record<string, unknown> | null;
}): Promise<SaveResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (data.id) {
    // Update existing work
    const { error } = await supabase
      .from("works")
      .update({
        title: data.title,
        code: data.code,
        template_id: data.templateId,
        params: data.params,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return { id: data.id };
  } else {
    // Create new work
    const { data: work, error } = await supabase
      .from("works")
      .insert({
        user_id: user.id,
        title: data.title,
        code: data.code,
        template_id: data.templateId,
        params: data.params,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { id: work.id };
  }
}

export type PublishResult = {
  slug?: string;
  error?: string;
};

export async function publishWork(workId: string, title: string): Promise<PublishResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const slug = generateSlug(title);

  const { error } = await supabase
    .from("works")
    .update({
      is_published: true,
      slug,
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { slug };
}

export async function loadWork(workId: string): Promise<{ work?: Work; error?: string }> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("id", workId)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { work: data as Work };
}

export async function listMyWorks(): Promise<{ works?: Work[]; error?: string }> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { error: error.message };
  return { works: data as Work[] };
}

export async function getPublishedWork(slug: string): Promise<{ work?: WorkWithProfile; error?: string }> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("works")
    .select("*, profiles(username, display_name)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return { error: error.message };
  return { work: data as WorkWithProfile };
}

export async function getArtistWorks(username: string): Promise<{
  profile?: { username: string; display_name: string | null; created_at: string };
  works?: Work[];
  error?: string;
}> {
  const supabase = await createServerSupabase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError) return { error: "Artist not found" };

  const { data: works, error: worksError } = await supabase
    .from("works")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (worksError) return { error: worksError.message };
  return { profile, works: works as Work[] };
}
```

- [ ] **Step 2: Write slug generation test**

Create `src/__tests__/lib/actions-works.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Test the slug generation logic (extracted for testing)
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "work"}-${suffix}`;
}

describe("generateSlug", () => {
  it("converts title to lowercase slug with suffix", () => {
    const slug = generateSlug("My Cool Art");
    expect(slug).toMatch(/^my-cool-art-[a-z0-9]+$/);
  });

  it("handles empty title", () => {
    const slug = generateSlug("");
    expect(slug).toMatch(/^work-[a-z0-9]+$/);
  });

  it("strips special characters", () => {
    const slug = generateSlug("Art @#$ Test!!!");
    expect(slug).toMatch(/^art-test-[a-z0-9]+$/);
  });

  it("truncates long titles", () => {
    const slug = generateSlug("This is a very long title that should be truncated to thirty characters max");
    const base = slug.split("-").slice(0, -1).join("-");
    expect(base.length).toBeLessThanOrEqual(30);
  });
});
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/works.ts src/__tests__/lib/actions-works.test.ts
git commit -m "feat: add works server actions (save, load, publish, list)"
```

---

### Task 5: Update Store and Toolbar for Save/Publish

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/components/studio/Toolbar.tsx`
- Modify: `src/components/studio/Studio.tsx`

Add work persistence state to the store and Save/Publish buttons to the toolbar.

- [ ] **Step 1: Update store**

In `src/lib/store.ts`, add to the `StudioState` type:

```typescript
  // Persistence
  workId: string | null;
  workTitle: string;
  workSlug: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  setWorkId: (id: string) => void;
  setWorkTitle: (title: string) => void;
  setWorkSlug: (slug: string) => void;
  setIsSaving: (saving: boolean) => void;
  setIsPublishing: (publishing: boolean) => void;
```

Add initial state:

```typescript
  workId: null,
  workTitle: "Untitled",
  workSlug: null,
  isSaving: false,
  isPublishing: false,
```

Add actions:

```typescript
  setWorkId: (id) => set({ workId: id }),
  setWorkTitle: (title) => set({ workTitle: title }),
  setWorkSlug: (slug) => set({ workSlug: slug }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setIsPublishing: (publishing) => set({ isPublishing: publishing }),
```

Update `setTemplate` to also reset work state:

```typescript
  setTemplate: (template) => {
    const defaults = getDefaultValues(template.schema);
    paramHistory.reset(defaults);
    return set({
      template,
      code: template.code,
      codeVersion: 0,
      schema: template.schema,
      values: defaults,
      status: "loading",
      error: null,
      canUndo: false,
      canRedo: false,
      workId: null,
      workTitle: "Untitled",
      workSlug: null,
    });
  },
```

- [ ] **Step 2: Update Toolbar with Save/Publish buttons**

In `src/components/studio/Toolbar.tsx`, add store subscriptions:

```typescript
  const workId = useStudioStore((s) => s.workId);
  const workSlug = useStudioStore((s) => s.workSlug);
  const isSaving = useStudioStore((s) => s.isSaving);
  const isPublishing = useStudioStore((s) => s.isPublishing);
```

Add Save and Publish buttons before the Export button. Save dispatches a custom event (like Export does):

```tsx
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("ergon:save"))}
          disabled={isSaving}
          className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] rounded text-ergon-muted hover:text-ergon-text hover:bg-ergon-surface transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        {workId && !workSlug && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ergon:publish"))}
            disabled={isPublishing}
            className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] rounded transition-colors bg-ergon-red text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        )}

        {workSlug && (
          <button
            onClick={() => window.open(`/work/${workSlug}`, "_blank")}
            className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            View
          </button>
        )}
```

- [ ] **Step 3: Wire save/publish handlers in Studio.tsx**

In `src/components/studio/Studio.tsx`, add imports:

```typescript
import { saveWork, publishWork } from "@/lib/actions/works";
```

Add store subscriptions:

```typescript
  const workId = useStudioStore((s) => s.workId);
  const workTitle = useStudioStore((s) => s.workTitle);
  const setWorkId = useStudioStore((s) => s.setWorkId);
  const setWorkSlug = useStudioStore((s) => s.setWorkSlug);
  const setIsSaving = useStudioStore((s) => s.setIsSaving);
  const setIsPublishing = useStudioStore((s) => s.setIsPublishing);
```

Add save handler:

```typescript
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await saveWork({
        id: workId ?? undefined,
        title: workTitle,
        code,
        templateId: template.id,
        params: values as Record<string, unknown>,
      });
      if (result.id) {
        setWorkId(result.id);
      }
    } finally {
      setIsSaving(false);
    }
  }, [workId, workTitle, code, template.id, values, setWorkId, setIsSaving]);
```

Add publish handler:

```typescript
  const handlePublish = useCallback(async () => {
    if (!workId) return;
    setIsPublishing(true);
    try {
      const result = await publishWork(workId, workTitle);
      if (result.slug) {
        setWorkSlug(result.slug);
      }
    } finally {
      setIsPublishing(false);
    }
  }, [workId, workTitle, setWorkSlug, setIsPublishing]);
```

Add event listeners (alongside existing export listener):

```typescript
  useEffect(() => {
    function onSave() { handleSave(); }
    function onPublish() { handlePublish(); }
    window.addEventListener("ergon:save", onSave);
    window.addEventListener("ergon:publish", onPublish);
    return () => {
      window.removeEventListener("ergon:save", onSave);
      window.removeEventListener("ergon:publish", onPublish);
    };
  }, [handleSave, handlePublish]);
```

- [ ] **Step 4: Run all tests and build**

```bash
npx vitest run && npm run build
```

Expected: All pass, clean build.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.ts src/components/studio/Toolbar.tsx src/components/studio/Studio.tsx
git commit -m "feat: add save/publish workflow to studio toolbar and store"
```

---

### Task 6: Public Work Viewer

**Files:**
- Create: `src/app/work/[slug]/page.tsx`

A minimal page that renders a published work full-screen with the artist's name.

- [ ] **Step 1: Create work viewer page**

Create `src/app/work/[slug]/page.tsx`:

```tsx
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
      {/* Thin header */}
      <div className="flex items-center justify-between px-5 h-10 border-b border-ergon-border shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[10px] font-bold text-ergon-text uppercase tracking-[0.25em] hover:opacity-70 transition-opacity"
          >
            Ergon
          </Link>
          <span className="text-[10px] text-ergon-muted">/</span>
          <span className="text-[11px] font-medium text-ergon-text">
            {work.title}
          </span>
        </div>
        <Link
          href={`/artist/${work.profiles.username}`}
          className="text-[10px] text-ergon-muted hover:text-ergon-text transition-colors uppercase tracking-[0.12em]"
        >
          by {work.profiles.display_name || work.profiles.username}
        </Link>
      </div>

      {/* Canvas — full bleed */}
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
```

Note: The sandbox loads code via URL hash. The runtime needs to check for this — that will be handled by updating the sandbox HTML to parse hash params and auto-load. For now, the iframe loads but won't execute code from the hash. This will be wired up in Task 8.

- [ ] **Step 2: Build to verify page compiles**

```bash
npm run build
```

Expected: Clean build with `/work/[slug]` route.

- [ ] **Step 3: Commit**

```bash
git add src/app/work/
git commit -m "feat: add public work viewer page at /work/[slug]"
```

---

### Task 7: Artist Profile Page

**Files:**
- Create: `src/app/artist/[username]/page.tsx`

Shows the artist's published works in a clean grid.

- [ ] **Step 1: Create artist profile page**

Create `src/app/artist/[username]/page.tsx`:

```tsx
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
      {/* Header */}
      <div className="border-b border-ergon-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="text-[10px] font-bold text-ergon-muted uppercase tracking-[0.25em] hover:text-ergon-text transition-colors"
          >
            Ergon
          </Link>

          <h1 className="text-[22px] font-bold text-ergon-text mt-6">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-[12px] text-ergon-muted font-mono mt-1">
            @{profile.username}
          </p>
        </div>
      </div>

      {/* Works grid */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {works && works.length > 0 ? (
          <>
            <h2 className="text-[10px] font-semibold text-ergon-subtle uppercase tracking-[0.18em] mb-6">
              Published Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((work) => (
                <Link
                  key={work.id}
                  href={`/work/${work.slug}`}
                  className="group border border-ergon-border rounded hover:border-ergon-text transition-colors"
                >
                  <div className="aspect-[4/3] bg-ergon-surface rounded-t" />
                  <div className="px-4 py-3 border-t border-ergon-border">
                    <h3 className="text-[12px] font-medium text-ergon-text group-hover:text-ergon-red transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-[10px] text-ergon-muted mt-1 font-mono">
                      {new Date(work.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-ergon-muted text-center py-12">
            No published works yet.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify page compiles**

```bash
npm run build
```

Expected: Clean build with `/artist/[username]` route.

- [ ] **Step 3: Commit**

```bash
git add src/app/artist/
git commit -m "feat: add artist profile page at /artist/[username]"
```

---

### Task 8: Sandbox Viewer Mode

**Files:**
- Modify: `public/sandbox/index.html`
- Modify: `src/runtime/index.ts`

Update the sandbox to support loading code from URL hash params, enabling the public work viewer.

- [ ] **Step 1: Update runtime to check for hash params**

In `src/runtime/index.ts`, add a function that checks for code in the URL hash on load:

```typescript
function checkHashParams(): void {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const code = params.get("code");
  const paramValues = params.get("params");

  if (code) {
    const decoded = decodeURIComponent(code);
    const values = paramValues ? JSON.parse(decodeURIComponent(paramValues)) : {};
    // Load code after a short delay to ensure p5.js is ready
    setTimeout(() => {
      executeCode(decoded, values);
    }, 200);
  }
}
```

Call `checkHashParams()` at the end of the runtime's initialization (after the message listener is set up).

Note: `executeCode` is the existing function in the runtime that loads and runs code. Check the current name — it may be named differently. Read `src/runtime/index.ts` to find the correct function name.

- [ ] **Step 2: Rebuild runtime**

```bash
npm run build:runtime
```

- [ ] **Step 3: Run all tests and build**

```bash
npx vitest run && npm run build
```

Expected: All pass, clean build.

- [ ] **Step 4: Commit**

```bash
git add src/runtime/index.ts public/sandbox/runtime.js
git commit -m "feat: sandbox supports loading code from URL hash for public viewer"
```

---

### Task 9: Auth Proxy

**Files:**
- Create: `src/proxy.ts`

Redirect unauthenticated users away from `/studio` to `/login`. Refresh Supabase sessions on every request.

- [ ] **Step 1: Create proxy**

Create `src/proxy.ts`:

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect studio — redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith("/studio") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/studio", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/studio/:path*", "/login", "/signup"],
};
```

- [ ] **Step 2: Build to verify proxy compiles**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add auth proxy to protect studio and redirect auth pages"
```

---

### Task 10: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Build application**

```bash
npm run build:runtime && npm run build
```

Expected: Clean build with all routes:
- `/` (home)
- `/login`
- `/signup`
- `/studio`
- `/work/[slug]`
- `/artist/[username]`

- [ ] **Step 3: Verify git status**

```bash
git log --oneline -12
```

Expected: 9 new commits for Tasks 1-9.
