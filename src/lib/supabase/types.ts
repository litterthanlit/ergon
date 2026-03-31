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
