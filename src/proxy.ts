import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseConfig();

  if (!config) {
    return response;
  }

  const supabase = createServerClient(
    config.url,
    config.anonKey,
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

  if (request.nextUrl.pathname.startsWith("/studio") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/studio", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/studio/:path*", "/login", "/signup"],
};
