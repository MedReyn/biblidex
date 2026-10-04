import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const destination = process.env.NODE_ENV === "development"
        ? requestUrl.origin + next
        : forwardedHost
          ? "https://" + forwardedHost + next
          : requestUrl.origin + next;

      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(new URL("/auth?error=auth_callback", requestUrl.origin));
}
