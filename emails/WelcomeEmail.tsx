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
  Row,
  Column,
  Img,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

const baseUrl = "https://vangatypepanalam.qzz.io";

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>வாங்க டைப் பண்ணலாம் — start typing in English, Tamil & Tanglish</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src={`${baseUrl}/logo-theme/logo.svg`}
              alt="VangaTypePanalam"
              width="160"
              style={logoImage}
            />
          </Section>

          <Section style={heroSection}>
            <Text style={tagline}>வாங்க டைப் பண்ணலாம்</Text>
            <Text style={greeting}>Welcome, {name}!</Text>
            <Text style={heroText}>
              You&apos;ve just taken the first step toward mastering typing in
              English, Tamil, and Tanglish — free, adaptive, and works offline.
            </Text>
          </Section>

          <Section style={statsSection}>
            <Row>
              <Column style={statColumn}>
                <Text style={statValue}>0</Text>
                <Text style={statLabel}>Words Typed</Text>
              </Column>
              <Column style={statColumn}>
                <Text style={statValue}>0</Text>
                <Text style={statLabel}>Day Streak</Text>
              </Column>
              <Column style={statColumn}>
                <Text style={statValue}>0</Text>
                <Text style={statLabel}>Peak WPM</Text>
              </Column>
            </Row>
          </Section>

          <Section style={featureSection}>
            <Text style={featureTitle}>1. Take a typing test</Text>
            <Text style={featureDesc}>
              Measure your current speed and accuracy in under a minute, and
              get your baseline WPM.
            </Text>
            <Link href={`${baseUrl}/test`} style={button}>
              Take a Test
            </Link>
          </Section>

          <Section style={featureSection}>
            <Text style={featureTitle}>2. Practice with adaptive lessons</Text>
            <Text style={featureDesc}>
              Real-time feedback and per-key tracking zero in on your weak
              keys automatically, in English, Tamil (Tamil99 / OW Phonetic),
              and Tanglish.
            </Text>
            <Link href={`${baseUrl}/lessons`} style={button}>
              Browse Lessons
            </Link>
          </Section>

          <Section style={featureSection}>
            <Text style={featureTitle}>3. Race against others</Text>
            <Text style={featureDesc}>
              Join real-time races to practice under pressure and climb the
              leaderboard.
            </Text>
            <Link href={`${baseUrl}/race`} style={button}>
              Join a Race
            </Link>
          </Section>

          <Hr style={hr} />

          <Section style={footerSection}>
            <Text style={footerText}>
              Track your daily streak, critical keys, and consistency on the{" "}
              <Link href={`${baseUrl}/stats`} style={footerLink}>
                stats page
              </Link>
              .
            </Text>
            <Text style={footerMuted}>
              If you didn&apos;t create this account, you can safely ignore this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0e0e0e",
  fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
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
  padding: "32px 32px 0",
  textAlign: "center" as const,
};

const logoImage = {
  margin: "0 auto",
  display: "block",
};

const heroSection = {
  padding: "0 32px 24px",
  textAlign: "center" as const,
};

const tagline = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#a78bfa",
  letterSpacing: "0.02em",
  margin: "0 0 12px",
};

const greeting = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#f1f5f9",
  margin: "0 0 8px",
};

const heroText = {
  fontSize: "15px",
  color: "#94a3b8",
  lineHeight: "1.6",
  margin: "0",
};

const statsSection = {
  padding: "0 32px 8px",
};

const statColumn = {
  textAlign: "center" as const,
  padding: "16px 8px",
  backgroundColor: "#141428",
  borderRadius: "10px",
};

const statValue = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#f1f5f9",
  margin: "0 0 4px",
};

const statLabel = {
  fontSize: "11px",
  color: "#94a3b8",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  margin: "0",
};

const featureSection = {
  padding: "24px 32px",
};

const featureTitle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#a78bfa",
  margin: "0 0 6px",
};

const featureDesc = {
  fontSize: "14px",
  color: "#cbd5e1",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const button = {
  display: "inline-block",
  padding: "10px 24px",
  backgroundColor: "#6366f1",
  color: "#ffffff",
  borderRadius: "8px",
  fontSize: "14px",
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
  margin: "0 0 8px",
};

const footerLink = {
  color: "#818cf8",
  textDecoration: "underline",
};

const footerMuted = {
  fontSize: "12px",
  color: "#64748b",
  margin: "0",
};