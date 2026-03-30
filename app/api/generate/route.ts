import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your .env.local file."
    );
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `You are a professional podcast content strategist. Return ONLY a valid JSON object with no extra text, no markdown, no code fences. The JSON must have these exact keys:
- summary (string: 4-5 sentence executive summary)
- showNotes (string: structured markdown with sections — Overview, Key Topics Covered as bullet points, 3 Best Quotes, Resources Mentioned, About This Episode)
- blogPost (string: 900-1100 word SEO blog post with H2 subheadings derived from the content, written in an engaging style)
- socialPack (object with keys: linkedin (string: 180-200 word post with 3 relevant hashtags), twitter (string: numbered thread of 6 tweets, each under 280 chars), instagram (string: 120 word caption with 5 hashtags))`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, podcastTitle } = body as {
      transcript: string;
      podcastTitle: string;
    };

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "No transcript provided." },
        { status: 400 }
      );
    }

    const groq = getGroq();

    const userMessage = `Podcast Title: ${podcastTitle || "Untitled Episode"}\n\nTranscript:\n${transcript}`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const raw = chatCompletion.choices[0]?.message?.content ?? "";

    // Strip any accidental code fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: {
      summary: string;
      showNotes: string;
      blogPost: string;
      socialPack: {
        linkedin: string;
        twitter: string;
        instagram: string;
      };
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[generate] JSON parse error. Raw response:", raw);
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: parsed.summary ?? "",
      showNotes: parsed.showNotes ?? "",
      blogPost: parsed.blogPost ?? "",
      socialPack: parsed.socialPack ?? { linkedin: "", twitter: "", instagram: "" },
    });
  } catch (err: unknown) {
    console.error("[generate] error:", err);
    const message =
      err instanceof Error ? err.message : "Content generation failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
