const PLACEHOLDER_URL_MARKERS = ["your-project", "your_supabase_project_url"];
const PLACEHOLDER_KEY_MARKERS = ["your-anon-key", "your_supabase_anon_key"];

export const SUPABASE_DISABLED_MESSAGE =
  "Supabase is not configured in this environment. The studio runs in demo mode, but auth, save, and publish are disabled.";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

function isPlaceholder(value: string, markers: string[]) {
  return markers.some((marker) => value.includes(marker));
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (isPlaceholder(url, PLACEHOLDER_URL_MARKERS) || isPlaceholder(anonKey, PLACEHOLDER_KEY_MARKERS)) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
