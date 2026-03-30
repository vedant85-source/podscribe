import Link from "next/link";

const features = [
  {
    emoji: "🎙️",
    title: "AI Transcription",
    description: "Whisper-powered, word-perfect transcripts from any audio format in seconds.",
  },
  {
    emoji: "📋",
    title: "Show Notes",
    description: "Structured show notes with key topics, best quotes, and resources mentioned.",
  },
  {
    emoji: "✍️",
    title: "Blog Post",
    description: "SEO-optimised 1,000-word blog article ready to publish from your episode.",
  },
  {
    emoji: "📣",
    title: "Social Pack",
    description: "LinkedIn, Twitter thread & Instagram captions — all written and ready to post.",
  },
];

const steps = [
  { number: "01", title: "Upload Audio", description: "Drop any MP3, WAV, M4A or MP4 file up to 25 MB." },
  { number: "02", title: "AI Processes", description: "Groq's Whisper transcribes and LLaMA 3.3 generates all content." },
  { number: "03", title: "Download Everything", description: "Copy, download individual files, or grab a single ZIP." },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          background: "rgba(15,15,15,0.85)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎙️</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                background: "var(--gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PodScribe
            </span>
          </div>
          <Link href="/app" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
            Launch App →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "100px 24px 80px",
          textAlign: "center",
        }}
        className="animate-fade-in-up"
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 100,
            padding: "6px 16px",
            fontSize: 13,
            color: "var(--accent-light)",
            marginBottom: 32,
            fontWeight: 500,
          }}
        >
          <span>✨</span> Powered by Groq — blazing fast AI
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 7vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            marginBottom: 24,
            color: "var(--text-primary)",
          }}
        >
          Turn Any Podcast Into a{" "}
          <span
            style={{
              background: "var(--gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Content Machine
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(17px, 2.5vw, 20px)",
            color: "var(--text-secondary)",
            maxWidth: 600,
            margin: "0 auto 48px",
            lineHeight: 1.7,
          }}
        >
          Upload your audio. Get transcript, show notes, blog post &amp; social content —{" "}
          <strong style={{ color: "var(--text-primary)" }}>in 60 seconds. Free forever.</strong>
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/app" className="btn-primary" style={{ fontSize: 17, padding: "16px 36px" }}>
            Start For Free →
          </Link>
          <a
            href="#how"
            className="btn-secondary"
            style={{ fontSize: 17, padding: "16px 32px" }}
          >
            See how it works
          </a>
        </div>

        {/* Social proof badge */}
        <p
          style={{
            marginTop: 40,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          No sign-up required · No credit card · Works instantly
        </p>
      </section>

      {/* Features grid */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 700,
            marginBottom: 12,
            color: "var(--text-primary)",
          }}
        >
          Everything you need from one episode
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            marginBottom: 48,
            fontSize: 16,
          }}
        >
          PodScribe outputs 5 pieces of content per upload, automatically.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card animate-fade-in-up"
              style={{
                padding: "32px 28px",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.emoji}</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              marginBottom: 12,
              color: "var(--text-primary)",
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              marginBottom: 56,
              fontSize: 16,
            }}
          >
            Three steps from audio file to ready-to-publish content.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 32,
            }}
          >
            {steps.map((s, i) => (
              <div key={s.number} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    background: "var(--gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {s.number}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "100px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: 20,
            letterSpacing: "-0.5px",
          }}
        >
          Start repurposing your podcast today
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 17,
            marginBottom: 40,
          }}
        >
          No account. No limits on file count. Just upload and go.
        </p>
        <Link
          href="/app"
          className="btn-primary animate-pulse-glow"
          style={{ fontSize: 17, padding: "16px 40px" }}
        >
          Start For Free →
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        PodScribe © 2025 · Built with Groq AI
      </footer>
    </div>
  );
}
