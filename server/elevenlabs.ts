/**
 * ElevenLabs Text-to-Speech Helper
 *
 * Generates high-quality speech audio from text using ElevenLabs API.
 * Each War Room persona gets a distinct voice for the boardroom debate.
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

/** Voice assignments for War Room personas */
export const PERSONA_VOICES: Record<string, { voiceId: string; description: string }> = {
  // CFO — composed, authoritative, professional
  "Eleanor Vance": {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - Mature, Reassuring, Confident
    description: "Professional female, American accent",
  },
  // Board Member — skeptical, measured gravitas
  "David Chen": {
    voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - Warm, Captivating Storyteller
    description: "Mature male, British accent",
  },
  // Operations Head — sharp, confident, direct
  "Aisha Rahman": {
    voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily - Velvety Actress
    description: "Confident female, British accent",
  },
};

/** Fallback voice for unknown persona names */
const FALLBACK_VOICE_ID = "cjVigY5qzO86Huf0OWal"; // Eric - Smooth, Trustworthy

/** Get the ElevenLabs voice ID for a persona name */
export function getVoiceIdForPersona(personaName: string): string {
  const match = PERSONA_VOICES[personaName];
  if (match) return match.voiceId;

  // Try partial match
  for (const [name, voice] of Object.entries(PERSONA_VOICES)) {
    if (personaName.toLowerCase().includes(name.split(" ")[0].toLowerCase())) {
      return voice.voiceId;
    }
  }

  return FALLBACK_VOICE_ID;
}

export interface SpeechOptions {
  /** ElevenLabs voice ID */
  voiceId: string;
  /** Stability: 0.0 (more variable) to 1.0 (more stable). Default 0.5 */
  stability?: number;
  /** Similarity boost: 0.0 to 1.0. Default 0.75 */
  similarityBoost?: number;
  /** Style exaggeration: 0.0 to 1.0. Default 0.0 */
  style?: number;
  /** Speed: 0.25 to 4.0. Default 1.0 */
  speed?: number;
}

/**
 * Generate speech audio from text using ElevenLabs API.
 * Returns raw MP3 audio buffer.
 */
export async function generateSpeech(
  text: string,
  options: SpeechOptions
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const {
    voiceId,
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.0,
    speed = 1.0,
  } = options;

  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: true,
        speed,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${errorText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate speech with emotion-tuned settings.
 * Adjusts stability, style, and speed based on the emotion tag.
 */
export function getEmotionSettings(
  emotion: string,
  isUnhinged: boolean
): Partial<SpeechOptions> {
  const base: Partial<SpeechOptions> = {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    speed: 1.0,
  };

  // Unhinged mode: faster, more expressive across the board
  if (isUnhinged) {
    base.stability = 0.3;
    base.style = 0.4;
    base.speed = 1.1;
  }

  switch (emotion) {
    case "assertive":
      return { ...base, stability: base.stability! - 0.05, style: base.style! + 0.15, speed: base.speed! + 0.05 };
    case "aggressive":
      return { ...base, stability: base.stability! - 0.1, style: base.style! + 0.3, speed: base.speed! + 0.1 };
    case "dismissive":
      return { ...base, stability: base.stability! + 0.1, style: base.style! + 0.1, speed: base.speed! - 0.05 };
    case "frustrated":
      return { ...base, stability: base.stability! - 0.15, style: base.style! + 0.25, speed: base.speed! + 0.08 };
    case "sarcastic":
      return { ...base, stability: base.stability! - 0.1, style: base.style! + 0.35, speed: base.speed! + 0.05 };
    case "neutral":
    default:
      return base;
  }
}
