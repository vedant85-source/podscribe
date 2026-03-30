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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    const allowedExtensions = /\.(mp3|wav|m4a|mp4)$/i;
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/x-m4a",
      "audio/m4a",
      "video/mp4",
    ];

    if (!allowedExtensions.test(file.name) && !allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload an MP3, WAV, M4A, or MP4 file." },
        { status: 400 }
      );
    }

    const groq = getGroq();

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const segments =
      (transcription as unknown as { segments?: { start: number; end: number; text: string }[] })
        .segments?.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(),
        })) ?? [];

    return NextResponse.json({
      transcript: transcription.text,
      segments,
    });
  } catch (err: unknown) {
    console.error("[transcribe] error:", err);
    const message =
      err instanceof Error ? err.message : "Transcription failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
