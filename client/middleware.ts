import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "cn_access_token";

export function middleware(request: NextRequest): NextResponse {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/cms/:path*"],
};
