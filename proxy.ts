import { NextResponse, type NextRequest } from "next/server";
import { OKT_COOKIE, lokalModus } from "@/lib/identitet";

/**
 * Sender den som ikke har en øktkapsel til innloggingen. Bare en grov første sperre: den ser
 * om kapselen finnes, ikke om økten er gyldig (det ville gi et databaseoppslag per forespørsel).
 * Den ekte sjekken er `innlogget()` i hver side og handling, og den står uansett.
 */
export function proxy(request: NextRequest) {
  if (lokalModus()) return NextResponse.next();
  if (request.nextUrl.pathname === "/logg-inn") return NextResponse.next();
  if (request.cookies.has(OKT_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/logg-inn", request.url));
}

export const config = {
  // Alt unntatt Next sine egne filer og filer med endelse (logoen, favicon).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
