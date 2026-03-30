"use client";

import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcessingStep =
  | "uploading"
  | "transcribing"
  | "generating"
  | "finishing"
  | "done";

interface SocialPack {
  linkedin: string;
  twitter: string;
  instagram: string;
}

interface Results {
  transcript: string;
  summary: string;
  showNotes: string;
  blogPost: string;
  socialPack: SocialPack;
}

type TabKey = "transcript" | "summary" | "showNotes" | "blogPost" | "socialPack";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "transcript", label: "Transcript", emoji: "📝" },
  { key: "summary", label: "Summary", emoji: "💡" },
  { key: "showNotes", label: "Show Notes", emoji: "📋" },
  { key: "blogPost", label: "Blog Post", emoji: "✍️" },
  { key: "socialPack", label: "Social Pack", emoji: "📣" },
];

const STEPS: { key: ProcessingStep; label: string }[] = [
  { key: "uploading", label: "Uploading audio..." },
  { key: "transcribing", label: "Transcribing with AI..." },
  { key: "generating", label: "Generating show notes & content..." },
  { key: "finishing", label: "Almost done..." },
];

const FILE_SIZE_LIMIT = 25 * 1024 * 1024; // 25 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getTabContent(results: Results, tab: TabKey): string {
  if (tab === "socialPack") {
    const sp = results.socialPack;
    return [
      "=== LINKEDIN ===",
      sp.linkedin,
      "",
      "=== TWITTER THREAD ===",
      sp.twitter,
      "",
      "=== INSTAGRAM ===",
      sp.instagram,
    ].join("\n");
  }
  return results[tab];
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="animate-spin-slow">
      <circle cx="24" cy="24" r="19" stroke="#2a2a2a" strokeWidth="5" />
      <path
        d="M24 5a19 19 0 0 1 19 19"
        stroke="url(#sg)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="sg" x1="24" y1="5" x2="43" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 18px",
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
        background: "transparent",
        color: copied ? "var(--success)" : "var(--text-secondary)",
        transition: "color 0.2s, border-color 0.2s",
        minWidth: 110,
        fontFamily: "inherit",
      }}
    >
      {copied ? "✓ Copied!" : "📋 Copy"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppPage() {
  const [file, setFile] = useState<File | null>(null);
  const [podcastTitle, setPodcastTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("transcript");
  const [error, setError] = useState<string | null>(null);

  const isProcessing = processingStep !== null && processingStep !== "done";
  const isDone = processingStep === "done" && results !== null;

  // ─── File validation ───────────────────────────────────────────────────────

  const validateAndSetFile = useCallback((f: File) => {
    setError(null);
    if (!f.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
      setError("Unsupported file type. Please upload an MP3, WAV, M4A, or MP4 file.");
      return;
    }
    if (f.size > FILE_SIZE_LIMIT) {
      setError(
        `File too large (${formatBytes(f.size)}). Maximum allowed size is 25 MB.`
      );
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) validateAndSetFile(dropped);
    },
    [validateAndSetFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) validateAndSetFile(picked);
  };

  // ─── Processing ────────────────────────────────────────────────────────────

  const handleTranscribe = async () => {
    if (!file) return;
    setError(null);
    setResults(null);

    try {
      setProcessingStep("uploading");
      const fd = new FormData();
      fd.append("audio", file);

      setProcessingStep("transcribing");
      const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!tRes.ok) {
        const d = await tRes.json();
        throw new Error(d.error ?? "Transcription failed.");
      }
      const { transcript } = await tRes.json();

      setProcessingStep("generating");
      const gRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, podcastTitle }),
      });
      if (!gRes.ok) {
        const d = await gRes.json();
        throw new Error(d.error ?? "Content generation failed.");
      }
      const generated = await gRes.json();

      setProcessingStep("finishing");
      await new Promise((r) => setTimeout(r, 700));

      setResults({ transcript, ...generated });
      setActiveTab("transcript");
      setProcessingStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setProcessingStep(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPodcastTitle("");
    setResults(null);
    setProcessingStep(null);
    setError(null);
    setActiveTab("transcript");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Downloads ─────────────────────────────────────────────────────────────

  const downloadTxt = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    if (!results) return;
    const zip = new JSZip();
    zip.file("transcript.txt", results.transcript);
    zip.file("summary.txt", results.summary);
    zip.file("show-notes.txt", results.showNotes);
    zip.file("blog-post.txt", results.blogPost);
    zip.file("social-pack.txt", getTabContent(results, "socialPack"));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (podcastTitle || "episode").replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
    a.download = `podscribe-${slug || "episode"}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const currentStepIndex = STEPS.findIndex((s) => s.key === processingStep);

  const S: React.CSSProperties = {}; // dummy to keep TS happy with inline styles

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        background: "rgba(15,15,15,0.92)",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 20 }}>🎙️</span>
            <span style={{ fontWeight: 700, fontSize: 17, background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              PodScribe
            </span>
          </a>
          {isDone && (
            <button onClick={handleReset} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: "pointer", border: "1px solid var(--border)",
              background: "transparent", color: "var(--text-secondary)", fontFamily: "inherit",
              transition: "color 0.2s, border-color 0.2s",
            }}>
              ↩ New Episode
            </button>
          )}
        </div>
      </nav>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: isProcessing || isDone ? "flex-start" : "center",
        justifyContent: "center",
        padding: "40px 20px 80px",
      }}>
        <div style={{ width: "100%", maxWidth: 820 }}>

          {/* ── ERROR BANNER ──────────────────────────────────────────── */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fca5a5", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Something went wrong
                </p>
                <p style={{ color: "#f87171", fontSize: 13, lineHeight: 1.6 }}>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 20, lineHeight: 1, flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STATE 1 — UPLOAD
          ════════════════════════════════════════════════════════════ */}
          {!isProcessing && !isDone && (
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "clamp(28px, 5vw, 48px) clamp(20px, 5vw, 44px)",
            }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🎙️</div>
                <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                  Repurpose Your Podcast
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 440, margin: "0 auto" }}>
                  Upload an audio file and get a transcript, show notes, blog post &amp; social content — instantly.
                </p>
              </div>

              {/* Drop zone */}
              <div
                id="drop-zone"
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => { if (!file) fileInputRef.current?.click(); }}
                style={{
                  border: `2px dashed ${isDragOver ? "#6366f1" : file ? "var(--success)" : "var(--border)"}`,
                  borderRadius: 14,
                  padding: "clamp(32px, 6vw, 52px) 24px",
                  textAlign: "center",
                  cursor: file ? "default" : "pointer",
                  background: isDragOver
                    ? "rgba(99,102,241,0.07)"
                    : file
                    ? "rgba(34,197,94,0.05)"
                    : "var(--bg-secondary)",
                  transition: "border-color 0.2s, background 0.2s",
                  marginBottom: 24,
                }}
              >
                <input
                  ref={fileInputRef}
                  id="audio-file-input"
                  type="file"
                  accept=".mp3,.wav,.m4a,.mp4,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {file ? (
                  <div>
                    <div style={{ fontSize: 38, marginBottom: 12 }}>🎵</div>
                    <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 6, wordBreak: "break-all" }}>
                      {file.name}
                    </p>
                    <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 18 }}>
                      {formatBytes(file.size)} · Ready to process
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setError(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        fontSize: 13, padding: "7px 16px", borderRadius: 8,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 44, marginBottom: 16 }}>
                      {isDragOver ? "⬇️" : "☁️"}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 8 }}>
                      {isDragOver ? "Drop it here!" : "Drag & drop your audio file"}
                    </p>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 18 }}>
                      or <span style={{ color: "var(--accent-light)", textDecoration: "underline" }}>browse to upload</span>
                    </p>
                    <span style={{
                      display: "inline-block", fontSize: 12, color: "var(--text-muted)",
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      borderRadius: 6, padding: "4px 12px",
                    }}>
                      MP3 · WAV · M4A · MP4 &nbsp;·&nbsp; max 25 MB
                    </span>
                  </div>
                )}
              </div>

              {/* Podcast title input */}
              <div style={{ marginBottom: 28 }}>
                <label htmlFor="podcast-title" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Podcast title&nbsp;
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional — improves output quality)</span>
                </label>
                <input
                  id="podcast-title"
                  type="text"
                  placeholder="e.g. The Tim Ferriss Show — Ep. 700"
                  value={podcastTitle}
                  onChange={(e) => setPodcastTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && file) handleTranscribe(); }}
                  style={{
                    width: "100%", background: "var(--bg-secondary)",
                    border: "1px solid var(--border)", borderRadius: 10,
                    color: "var(--text-primary)", fontSize: 14,
                    padding: "12px 16px", outline: "none",
                    transition: "border-color 0.2s", fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* CTA */}
              <button
                id="transcribe-btn"
                onClick={handleTranscribe}
                disabled={!file}
                style={{
                  width: "100%", padding: "16px", borderRadius: 12,
                  fontSize: 16, fontWeight: 600, border: "none", cursor: file ? "pointer" : "not-allowed",
                  background: file ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#2a2a2a",
                  color: file ? "white" : "var(--text-muted)",
                  transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { if (file) { (e.target as HTMLButtonElement).style.opacity = "0.9"; (e.target as HTMLButtonElement).style.transform = "translateY(-1px)"; } }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = "1"; (e.target as HTMLButtonElement).style.transform = "none"; }}
              >
                🚀 Transcribe Now
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STATE 2 — PROCESSING
          ════════════════════════════════════════════════════════════ */}
          {isProcessing && (
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "64px 40px",
              textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                <Spinner />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                {STEPS[currentStepIndex]?.label ?? "Processing..."}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 44 }}>
                This usually takes 20–60 seconds depending on file length.
              </p>

              {/* Step pills */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                {STEPS.map((s, i) => {
                  const isCurrent = i === currentStepIndex;
                  const isDone = i < currentStepIndex;
                  return (
                    <div key={s.key} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                      background: isCurrent ? "rgba(99,102,241,0.15)" : isDone ? "rgba(34,197,94,0.1)" : "var(--bg-secondary)",
                      border: `1px solid ${isCurrent ? "rgba(99,102,241,0.4)" : isDone ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                      color: isCurrent ? "var(--accent-light)" : isDone ? "var(--success)" : "var(--text-muted)",
                      transition: "all 0.3s",
                    }}>
                      <span>{isDone ? "✓" : isCurrent ? "●" : "○"}</span>
                      <span>{s.label.replace("...", "")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              STATE 3 — RESULTS
          ════════════════════════════════════════════════════════════ */}
          {isDone && results && (
            <div>
              {/* Heading */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
                <h1 style={{ fontSize: "clamp(20px, 3.5vw, 30px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Your content is ready!
                </h1>
                {podcastTitle && (
                  <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{podcastTitle}</p>
                )}
              </div>

              {/* Tab card */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
                {/* Tab bar */}
                <div style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "12px 16px 0",
                  display: "flex",
                  gap: 4,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                }}>
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      id={`tab-${t.key}`}
                      onClick={() => setActiveTab(t.key)}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "8px 8px 0 0",
                        fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                        whiteSpace: "nowrap", fontFamily: "inherit",
                        background: activeTab === t.key ? "rgba(99,102,241,0.15)" : "transparent",
                        color: activeTab === t.key ? "var(--accent-light)" : "var(--text-muted)",
                        borderBottom: activeTab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
                        transition: "color 0.2s, background 0.2s",
                      }}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div style={{ padding: "24px" }}>
                  {TABS.map((t) => {
                    if (t.key !== activeTab) return null;
                    const content = getTabContent(results, t.key);
                    const filenameStem =
                      t.key === "showNotes" ? "show-notes"
                      : t.key === "blogPost" ? "blog-post"
                      : t.key === "socialPack" ? "social-pack"
                      : t.key;

                    return (
                      <div key={t.key}>
                        {/* Action row */}
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                          <CopyButton text={content} />
                          <button
                            onClick={() => downloadTxt(content, `${filenameStem}.txt`)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 500,
                              cursor: "pointer", border: "1px solid var(--border)",
                              background: "transparent", color: "var(--text-secondary)",
                              transition: "color 0.2s, border-color 0.2s", fontFamily: "inherit",
                            }}
                          >
                            ⬇ Download .txt
                          </button>
                        </div>

                        {/* Textarea */}
                        <textarea
                          readOnly
                          value={content}
                          style={{
                            width: "100%",
                            minHeight: t.key === "blogPost" ? 500 : t.key === "showNotes" ? 420 : 320,
                            resize: "vertical",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            color: "var(--text-primary)",
                            fontSize: 14,
                            lineHeight: 1.75,
                            padding: "16px",
                            fontFamily: "inherit",
                            outline: "none",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom actions */}
              <div style={{ marginTop: 24, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  id="download-all-btn"
                  onClick={downloadAll}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white", fontFamily: "inherit",
                    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => { const el = e.target as HTMLButtonElement; el.style.opacity = "0.9"; el.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { const el = e.target as HTMLButtonElement; el.style.opacity = "1"; el.style.transform = "none"; }}
                >
                  📦 Download All (.zip)
                </button>
                <button
                  id="process-another-btn"
                  onClick={handleReset}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 500,
                    cursor: "pointer", border: "1px solid var(--border)",
                    background: "transparent", color: "var(--text-secondary)", fontFamily: "inherit",
                    transition: "color 0.2s, border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => { const el = e.target as HTMLButtonElement; el.style.color = "var(--text-primary)"; el.style.borderColor = "#444"; el.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { const el = e.target as HTMLButtonElement; el.style.color = "var(--text-secondary)"; el.style.borderColor = "var(--border)"; el.style.background = "transparent"; }}
                >
                  🔄 Process Another Episode
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
