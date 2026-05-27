import type { WorkDocument, WorkEngine } from "@/lib/work-document";

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
  engine: WorkEngine | null;
  document_version: number | null;
  document: WorkDocument | Record<string, unknown> | null;
  thumbnail_url: string | null;
  is_published: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkWithProfile = Work & {
  profiles: Pick<Profile, "username" | "display_name">;
};
