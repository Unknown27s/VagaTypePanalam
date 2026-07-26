import { BrevoClient } from "@getbrevo/brevo";

export interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

const DEFAULT_SENDER_EMAIL = "noreply@vangatypepanalam.qzz.io";
const DEFAULT_SENDER_NAME = "VangaTypePanalam";
const DEFAULT_REPLY_TO_EMAIL = "support@vangatypepanalam.qzz.io";
const DEFAULT_REPLY_TO_NAME = "Support";

export async function sendBrevoEmail(params: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  console.log("[Brevo] sendBrevoEmail called", { hasApiKey: !!apiKey, to: params.to, subject: params.subject });

  if (!apiKey) {
    console.warn("[Brevo] No BREVO_API_KEY set — skipping email send");
    return { skipped: true, reason: "Missing BREVO_API_KEY" };
  }

  const client = new BrevoClient({ apiKey });

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? DEFAULT_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? DEFAULT_SENDER_NAME;

  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      to: params.to.map((t) => ({ email: t.email, name: t.name })),
      subject: params.subject,
      htmlContent: params.htmlContent,
      sender: {
        email: senderEmail,
        name: senderName,
      },
      replyTo: params.replyTo ?? {
        email: process.env.BREVO_REPLY_TO_EMAIL ?? DEFAULT_REPLY_TO_EMAIL,
        name: process.env.BREVO_REPLY_TO_NAME ?? DEFAULT_REPLY_TO_NAME,
      },
      tags: params.tags,
    });

    console.log("[Brevo] Send success:", { messageId: result.messageId });
    return { success: true, messageId: result.messageId };
  } catch (err: any) {
    const errorBody = err.response?.data ?? err.message ?? "Unknown error";
    const errorStatus = err.response?.status ?? err.status ?? 0;
    console.error(`[Brevo] Send failed (HTTP ${errorStatus}):`, JSON.stringify(errorBody));

    if (errorStatus === 403 || errorStatus === 400) {
      const bodyStr = typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody);
      if (bodyStr.includes("sender") || bodyStr.includes("from") || bodyStr.includes("verified") || bodyStr.includes("domain")) {
        console.error(
          `[Brevo] SENDER NOT VERIFIED. The email domain "${senderEmail}" must be verified in your Brevo dashboard.\n` +
          `  Fix: Go to https://app.brevo.com/senders/ and add/verify the sender domain.\n` +
          `  Alternatively, set BREVO_SENDER_EMAIL and BREVO_SENDER_NAME in .env to a verified sender.`
        );
      }
    }

    throw err;
  }
}
