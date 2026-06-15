import { COOKIE_ACCESS_TOKEN } from "../constants/app.constant";

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    }
  }
  return out;
}

/** Same precedence as AdminJwtAuthGuard: cookie, then socket auth / Bearer. */
export function extractAccessTokenFromParts(parts: {
  cookieHeader?: string;
  authorization?: string;
  authToken?: string;
}): string | undefined {
  const cookies = parseCookieHeader(parts.cookieHeader);
  const fromCookie = cookies[COOKIE_ACCESS_TOKEN];
  if (fromCookie) return fromCookie;

  if (typeof parts.authToken === "string" && parts.authToken.trim()) {
    return parts.authToken.trim();
  }

  const header = parts.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return undefined;
}
