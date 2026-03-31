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
