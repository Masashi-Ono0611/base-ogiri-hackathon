import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ONBOARDING_COOKIE_KEY = "onboarding_version";
const ONBOARDING_VERSION = "0.1.0";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isWalkthrough = pathname === "/walkthrough";
  const isRoot = pathname === "/";
  const isDeposit = pathname === "/deposit";

  if (!isRoot && !isDeposit && !isWalkthrough) {
    return NextResponse.next();
  }

  if (isWalkthrough) {
    return NextResponse.next();
  }

  const completedVersion = req.cookies.get(ONBOARDING_COOKIE_KEY)?.value;
  const isCompleted = completedVersion === ONBOARDING_VERSION;

  if (isCompleted) {
    return NextResponse.next();
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/walkthrough";
  redirectUrl.searchParams.set("next", pathname + (search || ""));

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/", "/deposit", "/walkthrough"],
};
