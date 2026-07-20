import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Domain the app is restricted to. Override with ALLOWED_EMAIL_DOMAIN if
// this ever needs to run for a different org.
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "gwi.com";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/unauthorized"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const email = user.email || "";
    const domain = email.split("@")[1]?.toLowerCase();
    const allowed = domain === ALLOWED_DOMAIN.toLowerCase();

    if (!allowed && pathname !== "/unauthorized" && !pathname.startsWith("/auth/callback")) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (allowed && pathname === "/login") {
      return NextResponse.redirect(new URL("/library", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
