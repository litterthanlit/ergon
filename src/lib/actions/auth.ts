"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { SUPABASE_DISABLED_MESSAGE } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

export type AuthResult = {
  error?: string;
};

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }

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

  if (!supabase) {
    return { error: SUPABASE_DISABLED_MESSAGE };
  }

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
  if (!supabase) {
    redirect("/studio");
  }
  await supabase.auth.signOut();
  redirect("/login");
}
