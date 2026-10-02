import { createGoogle } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Each request mints a fresh, short-lived credential, so never cache it.
export const dynamic = "force-dynamic";

const MODEL_ID = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Puck";
const DEFAULT_INSTRUCTIONS =
  "You are a helpful, concise voice assistant joining a live meeting. " +
  "Keep replies short and conversational unless asked to go deeper.";
const DEFAULT_TTL_SECONDS = 60;
const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 300;
const MAX_INSTRUCTIONS_CHARS = 8000;
const MAX_VOICE_CHARS = 64;

type TalkRequestBody = {
  instructions?: unknown;
  voice?: unknown;
  expiresAfterSeconds?: unknown;
};

/**
 * Mints a short-lived, model-constrained Google Live auth token. The browser
 * opens the returned WebSocket URL directly with `?access_token=<token>`; the
 * API key never leaves the server.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (userId === null) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Sign in to start a live session" },
      { status: 401 },
    );
  }

  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "ai: set GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) to enable live sessions",
    );
    return NextResponse.json(
      { error: "server_misconfigured", message: "Realtime is not configured" },
      { status: 500 },
    );
  }

  let body: TalkRequestBody = {};
  try {
    const raw = await request.text();
    body = raw.length > 0 ? (JSON.parse(raw) as TalkRequestBody) : {};
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const instructions = readString(
    body.instructions,
    DEFAULT_INSTRUCTIONS,
    MAX_INSTRUCTIONS_CHARS,
  );
  const voice = readString(body.voice, DEFAULT_VOICE, MAX_VOICE_CHARS);
  const expiresAfterSeconds = clampInt(
    body.expiresAfterSeconds,
    DEFAULT_TTL_SECONDS,
    MIN_TTL_SECONDS,
    MAX_TTL_SECONDS,
  );

  try {
    const google = createGoogle({ apiKey });
    const session = await google.experimental_realtime.getToken({
      model: MODEL_ID,
      expiresAfterSeconds,
      sessionConfig: {
        instructions,
        voice,
        outputModalities: ["audio", "text"],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });

    return NextResponse.json(
      {
        model: MODEL_ID,
        token: session.token,
        url: session.url,
        expiresAt: session.expiresAt ?? null,
        expiresAfterSeconds,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("ai: token mint failed", error);
    return NextResponse.json(
      {
        error: "realtime_token_failed",
        message: "Could not start the live session",
      },
      { status: 502 },
    );
  }
}

function readString(
  value: unknown,
  fallback: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function clampInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.round(value), min), max);
}
