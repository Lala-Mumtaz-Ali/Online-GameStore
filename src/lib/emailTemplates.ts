import { env } from "@/utils/env";

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">${title}</h1>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #888;">GameStore &mdash; a portfolio project.</p>
  </div>`;
}

function itemsTable(items: { title: string; price: number; quantity: number }[]) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 6px 0;">${escapeHtml(item.title)} × ${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">${rows}</table>`;
}

export function verifyEmailTemplate({
  name,
  token,
}: {
  name: string | null;
  token: string;
}) {
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return layout(
    "Confirm your email",
    `
    <p>Hi ${escapeHtml(name ?? "there")},</p>
    <p>Thanks for signing up at GameStore. Please confirm this is your email address:</p>
    <p><a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Verify email</a></p>
    <p style="font-size: 13px; color: #666;">Or paste this link in your browser: ${verifyUrl}</p>
    `
  );
}

export function resetPasswordTemplate({
  name,
  token,
}: {
  name: string | null;
  token: string;
}) {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return layout(
    "Reset your password",
    `
    <p>Hi ${escapeHtml(name ?? "there")},</p>
    <p>We received a request to reset the password on your GameStore account. Use the button below to choose a new one.</p>
    <p><a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Reset password</a></p>
    <p style="font-size: 13px; color: #666;">This link expires in 1 hour and can only be used once.</p>
    <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email &mdash; your password won't change.</p>
    <p style="font-size: 13px; color: #666;">Or paste this link in your browser: ${resetUrl}</p>
    `
  );
}

export function orderConfirmationTemplate({
  name,
  orderId,
  items,
  total,
}: {
  name: string | null;
  orderId: string;
  items: { title: string; price: number; quantity: number }[];
  total: number;
}) {
  return layout(
    "Order confirmed",
    `
    <p>Hi ${escapeHtml(name ?? "there")},</p>
    <p>Your order <strong>#${orderId.slice(-8)}</strong> is confirmed. Here's what you got:</p>
    ${itemsTable(items)}
    <p style="font-weight: 600;">Total: $${total.toFixed(2)}</p>
    <p><a href="${appUrl}/orders/${orderId}">View your order</a></p>
    `
  );
}

export function abandonedCartReminderTemplate({
  name,
  items,
}: {
  name: string | null;
  items: { title: string; price: number; quantity: number }[];
}) {
  return layout(
    "You left something in your cart",
    `
    <p>Hi ${escapeHtml(name ?? "there")},</p>
    <p>These are still waiting in your cart:</p>
    ${itemsTable(items)}
    <p><a href="${appUrl}/cart" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Go to cart</a></p>
    `
  );
}

export function releaseNotifyTemplate({
  name,
  gameTitle,
  gameSlug,
}: {
  name: string | null;
  gameTitle: string;
  gameSlug: string;
}) {
  return layout(
    `${escapeHtml(gameTitle)} is now available!`,
    `
    <p>Hi ${escapeHtml(name ?? "there")},</p>
    <p><strong>${escapeHtml(gameTitle)}</strong> just released &mdash; you asked to be notified.</p>
    <p><a href="${appUrl}/games/${encodeURIComponent(gameSlug)}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">View game</a></p>
    `
  );
}

export function preorderFulfilledTemplate({
  name,
  orderId,
  gameTitle,
  price,
}: {
  name: string | null;
  orderId: string;
  gameTitle: string;
  price: number;
}) {
  return layout(
    `${escapeHtml(gameTitle)} has released &mdash; your preorder is complete`,
    `
    <p>Hi ${escapeHtml(name ?? "there")},</p>
    <p>Your preorder of <strong>${escapeHtml(gameTitle)}</strong> ($${price.toFixed(2)}) has been automatically completed now that it's released. It's in your library.</p>
    <p><a href="${appUrl}/orders/${orderId}">View order</a> &middot; <a href="${appUrl}/library">Go to library</a></p>
    `
  );
}

export function weeklyAdminReportTemplate({
  weekLabel,
  newOrders,
  revenue,
  newUsers,
  topGame,
}: {
  weekLabel: string;
  newOrders: number;
  revenue: number;
  newUsers: number;
  topGame: { title: string; unitsSold: number } | null;
}) {
  return layout(
    `Weekly report &mdash; ${weekLabel}`,
    `
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 6px 0;">New orders</td><td style="text-align: right;">${newOrders}</td></tr>
      <tr><td style="padding: 6px 0;">Revenue</td><td style="text-align: right;">$${revenue.toFixed(2)}</td></tr>
      <tr><td style="padding: 6px 0;">New users</td><td style="text-align: right;">${newUsers}</td></tr>
      <tr><td style="padding: 6px 0;">Top seller</td><td style="text-align: right;">${
        topGame ? `${escapeHtml(topGame.title)} (${topGame.unitsSold} sold)` : "—"
      }</td></tr>
    </table>
    <p><a href="${appUrl}/admin">Open admin dashboard</a></p>
    `
  );
}
