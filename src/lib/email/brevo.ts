import { BrevoClient } from "@getbrevo/brevo";

export interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

export async function sendBrevoEmail(params: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  console.log("[Brevo] sendBrevoEmail called", { hasApiKey: !!apiKey, to: params.to, subject: params.subject });

  if (!apiKey) {
    console.warn("[Brevo] No BREVO_API_KEY set — skipping email send");
    return { skipped: true };
  }

  const client = new BrevoClient({ apiKey });
  console.log("[Brevo] Client created, sending...");

  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      to: params.to.map((t) => ({ email: t.email, name: t.name })),
      subject: params.subject,
      htmlContent: params.htmlContent,
      sender: {
        email: process.env.BREVO_SENDER_EMAIL ?? "noreply@vangatypepanalam.qzz.io",
        name: process.env.BREVO_SENDER_NAME ?? "VangaTypePanalam",
      },
      replyTo: params.replyTo ?? {
        email: process.env.BREVO_REPLY_TO_EMAIL ?? "support@vangatypepanalam.qzz.io",
        name: process.env.BREVO_REPLY_TO_NAME ?? "Support",
      },
      tags: params.tags,
    });

    console.log("[Brevo] Send success:", { messageId: result.messageId });
    return { success: true, messageId: result.messageId };
  } catch (err: any) {
    console.error("[Brevo] Send failed:", err.response?.data ?? err.message, err.stack);
    throw err;
  }
}
