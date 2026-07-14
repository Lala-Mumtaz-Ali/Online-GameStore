import "server-only";
import { Resend } from "resend";
import { env } from "@/utils/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[email:skipped, no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[email:failed] to=${to} subject="${subject}"`, error);
    }
  } catch (err) {
    console.error(`[email:failed] to=${to} subject="${subject}"`, err);
  }
}
