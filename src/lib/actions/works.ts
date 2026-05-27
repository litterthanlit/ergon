"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { SUPABASE_DISABLED_MESSAGE } from "@/lib/supabase/config";
import type { Work, WorkWithProfile } from "@/lib/supabase/types";
import {
  legacyFieldsFromWorkDocument,
  type AssetRef,
  type WorkDocument,
} from "@/lib/work-document";

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
  thumbnailUrl?: string;
  error?: string;
};

const THUMBNAIL_BUCKET = "work-thumbnails";

function parseDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
}

function withThumbnail(document: WorkDocument, thumbnail: AssetRef): WorkDocument {
  return { ...document, thumbnail } as WorkDocument;
}

function payloadForWork(title: string, document: WorkDocument, thumbnail?: AssetRef) {
  const documentWithThumbnail = thumbnail ? withThumbnail(document, thumbnail) : document;
  const legacy = legacyFieldsFromWorkDocument(documentWithThumbnail);

  const payload: {
    title: string;
    code: string;
    template_id: string | null;
    params: Record<string, unknown> | null;
    engine: WorkDocument["engine"];
    document_version: WorkDocument["version"];
    document: WorkDocument;
    thumbnail_url?: string;
    updated_at: string;
  } = {
    title,
    code: legacy.code,
    template_id: legacy.templateId,
    params: legacy.params,
    engine: documentWithThumbnail.engine,
    document_version: documentWithThumbnail.version,
    document: documentWithThumbnail,
    updated_at: new Date().toISOString(),
  };

  if (thumbnail) payload.thumbnail_url = thumbnail.url;
  return payload;
}

async function uploadThumbnail(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
  workId: string,
  dataUrl: string
): Promise<{ thumbnail?: AssetRef; error?: string }> {
  if (!supabase) return { error: SUPABASE_DISABLED_MESSAGE };
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return { error: "Invalid thumbnail data URL" };

  const path = `${userId}/${workId}/thumb.png`;
  const bucket = supabase.storage.from(THUMBNAIL_BUCKET);
  const { error } = await bucket.upload(path, parsed.bytes, {
    contentType: parsed.contentType,
    upsert: true,
  });
  if (error) return { error: error.message };

  const { data } = bucket.getPublicUrl(path);
  return {
    thumbnail: {
      url: data.publicUrl,
      bucket: THUMBNAIL_BUCKET,
      path,
      mimeType: parsed.contentType,
    },
  };
}

export async function saveWork(data: {
  id?: string;
  title: string;
  document: WorkDocument;
  thumbnailDataUrl?: string | null;
}): Promise<SaveResult> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (data.id) {
    let thumbnail: AssetRef | undefined;
    if (data.thumbnailDataUrl) {
      const uploaded = await uploadThumbnail(supabase, user.id, data.id, data.thumbnailDataUrl);
      if (uploaded.error) return { error: uploaded.error };
      thumbnail = uploaded.thumbnail;
    }

    const { error } = await supabase
      .from("works")
      .update(payloadForWork(data.title, data.document, thumbnail))
      .eq("id", data.id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return { id: data.id, thumbnailUrl: thumbnail?.url };
  } else {
    const { data: work, error } = await supabase
      .from("works")
      .insert({
        user_id: user.id,
        ...payloadForWork(data.title, data.document),
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    if (!data.thumbnailDataUrl) return { id: work.id };

    const uploaded = await uploadThumbnail(supabase, user.id, work.id, data.thumbnailDataUrl);
    if (uploaded.error) return { error: uploaded.error };
    const thumbnail = uploaded.thumbnail;
    if (!thumbnail) return { id: work.id };

    const update = await supabase
      .from("works")
      .update({
        document: withThumbnail(data.document, thumbnail),
        thumbnail_url: thumbnail.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", work.id)
      .eq("user_id", user.id);
    if (update.error) return { error: update.error.message };

    return { id: work.id, thumbnailUrl: thumbnail.url };
  }
}

export type PublishResult = {
  slug?: string;
  error?: string;
};

export async function publishWork(workId: string, title: string): Promise<PublishResult> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }
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

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }
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

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }
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

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }

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

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }

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
