import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/redirects";

describe("safeCallbackUrl", () => {
  it("allows same-origin paths", () => {
    expect(safeCallbackUrl("/account")).toBe("/account");
    expect(safeCallbackUrl("/games?q=ronin&page=2")).toBe("/games?q=ronin&page=2");
    expect(safeCallbackUrl("/")).toBe("/");
  });

  it("falls back when there is no callback url", () => {
    expect(safeCallbackUrl(undefined)).toBe("/");
    expect(safeCallbackUrl("")).toBe("/");
  });

  it("uses a caller-supplied fallback", () => {
    expect(safeCallbackUrl(undefined, "/library")).toBe("/library");
  });

  // The open-redirect cases. //evil.com is protocol-relative and passes a naive
  // startsWith("/") check.
  it("rejects protocol-relative URLs", () => {
    expect(safeCallbackUrl("//evil.com")).toBe("/");
    expect(safeCallbackUrl("//evil.com/phishing")).toBe("/");
  });

  it("rejects backslash variants that some browsers normalise", () => {
    expect(safeCallbackUrl("/\\evil.com")).toBe("/");
  });

  it("rejects absolute URLs to other origins", () => {
    expect(safeCallbackUrl("https://evil.com")).toBe("/");
    expect(safeCallbackUrl("http://evil.com")).toBe("/");
  });

  it("rejects non-http schemes", () => {
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/");
    expect(safeCallbackUrl("data:text/html,<script>alert(1)</script>")).toBe("/");
  });

  it("rejects bare paths that are not rooted", () => {
    expect(safeCallbackUrl("account")).toBe("/");
    expect(safeCallbackUrl("evil.com")).toBe("/");
  });
});
