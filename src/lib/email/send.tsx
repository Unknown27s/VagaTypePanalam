import { render } from "@react-email/components";
import WelcomeEmail from "../../../emails/WelcomeEmail";
import WeeklyBookUpdate from "../../../emails/WeeklyBookUpdate";
import BlogUpdate from "../../../emails/BlogUpdate";
import { sendBrevoEmail } from "./brevo";

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}) {
  console.log("[send] Rendering WelcomeEmail for", params.to);
  const html = await render(<WelcomeEmail name={params.name} />);
  console.log("[send] Rendered successfully, length:", html.length);
  return sendBrevoEmail({
    to: [{ email: params.to, name: params.name }],
    subject: "Welcome to VangaTypePanalam!",
    htmlContent: html,
    tags: ["welcome"],
  });
}

export async function sendWeeklyBookUpdate(params: {
  to: string;
  name: string;
  books: { title: string; description: string; url: string }[];
  unsubscribeToken: string;
}) {
  const html = await render(
    <WeeklyBookUpdate
      name={params.name}
      books={params.books}
      unsubscribeUrl={`https://vangatypepanalam.qzz.io/unsubscribe?token=${params.unsubscribeToken}`}
    />
  );
  return sendBrevoEmail({
    to: [{ email: params.to, name: params.name }],
    subject: "Your Weekly Practice Books — VangaTypePanalam",
    htmlContent: html,
    tags: ["weekly-books"],
  });
}

export async function sendBlogUpdate(params: {
  to: string;
  name: string;
  posts: { title: string; excerpt: string; url: string }[];
  unsubscribeToken: string;
}) {
  const html = await render(
    <BlogUpdate
      name={params.name}
      posts={params.posts}
      unsubscribeUrl={`https://vangatypepanalam.qzz.io/unsubscribe?token=${params.unsubscribeToken}`}
    />
  );
  return sendBrevoEmail({
    to: [{ email: params.to, name: params.name }],
    subject: "New from VangaTypePanalam Blog",
    htmlContent: html,
    tags: ["blog-update"],
  });
}
