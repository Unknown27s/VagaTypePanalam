import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface BlogPost {
  title: string;
  excerpt: string;
  url: string;
}

interface BlogUpdateProps {
  name: string;
  posts: BlogPost[];
  unsubscribeUrl: string;
}

export default function BlogUpdate({
  name,
  posts,
  unsubscribeUrl,
}: BlogUpdateProps) {
  return (
    <Html>
      <Head />
      <Preview>Latest tips and updates from VangaTypePanalam</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logoText}>VangaTypePanalam</Text>
            <Text style={headline}>Blog Updates</Text>
          </Section>

          <Section style={greetingSection}>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={paragraph}>
              Check out the latest posts from our blog — tips, tricks, and
              updates to help you become a faster typist.
            </Text>
          </Section>

          {posts.map((post, i) => (
            <Section key={i} style={postCard}>
              <Text style={postTitle}>{post.title}</Text>
              <Text style={postExcerpt}>{post.excerpt}</Text>
              <Link href={post.url} style={button}>
                Read More
              </Link>
            </Section>
          ))}

          <Hr style={hr} />

          <Section style={footerSection}>
            <Text style={footerText}>
              Visit the{" "}
              <Link href="https://vangatypepanalam.qzz.io/blog" style={link}>
                blog
              </Link>{" "}
              for the latest posts.
            </Text>
            <Link href={unsubscribeUrl} style={unsubscribe}>
              Unsubscribe from blog updates
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0e0e0e",
  fontFamily:
    '-apple-system, "Segoe UI", Roboto, sans-serif',
  padding: "40px 0",
};

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#1a1a2e",
  borderRadius: "12px",
  overflow: "hidden",
};

const headerSection = {
  padding: "32px 32px 8px",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "24px",
  fontWeight: 800,
  color: "#f1f5f9",
  letterSpacing: "-0.02em",
  margin: "0 0 4px",
};

const headline = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#a78bfa",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0",
};

const greetingSection = {
  padding: "24px 32px 8px",
};

const greeting = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#f1f5f9",
  margin: "0 0 8px",
};

const paragraph = {
  fontSize: "14px",
  color: "#94a3b8",
  lineHeight: "1.6",
  margin: "0",
};

const postCard = {
  padding: "20px 32px",
};

const postTitle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#f1f5f9",
  margin: "0 0 4px",
};

const postExcerpt = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

const button = {
  display: "inline-block",
  padding: "8px 20px",
  backgroundColor: "#6366f1",
  color: "#ffffff",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  textDecoration: "none",
};

const hr = {
  border: "none",
  borderTop: "1px solid #334155",
  margin: "0 32px",
};

const footerSection = {
  padding: "24px 32px 32px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

const link = {
  color: "#818cf8",
  textDecoration: "underline",
};

const unsubscribe = {
  fontSize: "11px",
  color: "#64748b",
  textDecoration: "underline",
};
