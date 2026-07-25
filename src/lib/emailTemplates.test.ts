import { describe, expect, it } from "vitest";
import {
  orderConfirmationTemplate,
  releaseNotifyTemplate,
  verifyEmailTemplate,
  weeklyAdminReportTemplate,
} from "@/lib/emailTemplates";

/**
 * These are characterization tests for HTML escaping in outbound email.
 *
 * `escapeHtml` is intentionally NOT exported — the tests go through the public
 * templates rather than widening the module's API just to reach a private helper.
 */
describe("email templates escape user-controlled input", () => {
  it("escapes a script tag in the recipient name", () => {
    const html = verifyEmailTemplate({ name: "<script>alert(1)</script>", token: "tok" });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  // The classic escaping bug: replacing < and > before & double-escapes the
  // ampersands introduced by the earlier replacements ("&amp;amp;"). This pins
  // the ordering.
  it("replaces & before the other entities, so escaping is not applied twice", () => {
    const html = verifyEmailTemplate({ name: "Tom & <Jerry>", token: "tok" });

    expect(html).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(html).not.toContain("&amp;amp;");
  });

  it("escapes quotes that could break out of an HTML attribute", () => {
    const html = verifyEmailTemplate({ name: `" onmouseover="alert(1)`, token: "tok" });

    expect(html).not.toContain(`" onmouseover="`);
    expect(html).toContain("&quot;");
  });

  it("escapes game titles, which are admin-supplied free text", () => {
    const html = releaseNotifyTemplate({
      name: null,
      gameTitle: "<b>Doom</b>",
      gameSlug: "doom",
    });

    expect(html).not.toContain("<b>Doom</b>");
    expect(html).toContain("&lt;b&gt;Doom&lt;/b&gt;");
  });

  it("escapes item titles inside the order items table", () => {
    const html = orderConfirmationTemplate({
      name: "Ada",
      orderId: "order_12345678",
      items: [{ title: "<img src=x onerror=alert(1)>", price: 10, quantity: 1 }],
      total: 10,
    });

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes the top seller title in the weekly admin report", () => {
    const html = weeklyAdminReportTemplate({
      weekLabel: "Jul 20 - Jul 26",
      newOrders: 3,
      revenue: 120,
      newUsers: 2,
      topGame: { title: "<i>Ronin</i>", unitsSold: 4 },
    });

    expect(html).not.toContain("<i>Ronin</i>");
    expect(html).toContain("&lt;i&gt;Ronin&lt;/i&gt;");
  });
});

describe("verifyEmailTemplate", () => {
  it("falls back to a friendly greeting when the name is null", () => {
    expect(verifyEmailTemplate({ name: null, token: "tok" })).toContain("Hi there,");
  });

  it("percent-encodes the token into the verification link", () => {
    const html = verifyEmailTemplate({ name: "Ada", token: "a+b/c=" });

    expect(html).toContain("/verify-email?token=a%2Bb%2Fc%3D");
  });

  it("builds the link against the configured app URL", () => {
    expect(verifyEmailTemplate({ name: "Ada", token: "tok" })).toContain(
      "http://localhost:3000/verify-email"
    );
  });
});

describe("weeklyAdminReportTemplate", () => {
  it("renders an em dash when there is no top seller", () => {
    const html = weeklyAdminReportTemplate({
      weekLabel: "Jul 20 - Jul 26",
      newOrders: 0,
      revenue: 0,
      newUsers: 0,
      topGame: null,
    });

    expect(html).toContain("$0.00");
    expect(html).toContain("—");
  });
});
