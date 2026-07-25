/**
 * Reduce an untrusted `callbackUrl` query param to a safe same-origin path.
 *
 * The `//` check is the one that matters: `//evil.com` is a protocol-relative
 * URL, so it passes a naive `startsWith("/")` and then navigates off-site. That
 * is an open redirect, which is exactly what makes a phishing link look
 * legitimate — the victim really did start on your domain.
 *
 * A backslash is rejected too, because some browsers normalise `\\evil.com` the
 * same way.
 */
export function safeCallbackUrl(callbackUrl: string | undefined, fallback = "/"): string {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/")) return fallback;
  if (callbackUrl.startsWith("//") || callbackUrl.startsWith("/\\")) return fallback;
  return callbackUrl;
}
