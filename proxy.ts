import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Cron 엔드포인트 보호
  if (request.nextUrl.pathname === "/api/cron") {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/cron"],
};
