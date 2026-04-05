/**
 * ElevenLabs Text-to-Speech Helper
 *
 * Generates high-quality speech audio from text using ElevenLabs API.
 * Each War Room persona gets a distinct voice for the boardroom debate.
 * Voice assignment uses exact name match → role hint → round-robin pool.
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// ===== VOICE CATALOG =====
const VOICES = {
  sarah: "EXAVITQu4vr4xnSDxMaL",    // Sarah - Mature, Reassuring, Confident (American female)
  lily: "pFZP5JQG7iQjIQuC4Bku",      // Lily - Velvety Actress (British female)
  alice: "Xb7hH8MSUJpSbSDYk0k2",     // Alice - Clear, Engaging Educator (British female)
  bella: "hpp4J3VqNfWAUOO0d1Us",      // Bella - Professional, Bright (American female)
  george: "JBFqnCBsd6RMkjVDRZzb",    // George - Warm, Captivating Storyteller (British male)
  daniel: "onwK4e9ZLuTAKqWW03F9",    // Daniel - Steady Broadcaster (British male)
  eric: "cjVigY5qzO86Huf0OWal",      // Eric - Smooth, Trustworthy (American male)
  charlie: "IKne3meq5aSn9XLyUdCD",   // Charlie - Deep, Confident (Australian male)
};

/** Exact name → voice mapping for known demo personas */
const EXACT_NAME_MAP: Record<string, string> = {
  "Eleanor Vance": VOICES.sarah,
  "David Chen": VOICES.george,
  "Aisha Rahman": VOICES.lily,
};

/** Voice pools for round-robin assignment */
const FEMALE_VOICE_POOL = [VOICES.sarah, VOICES.lily, VOICES.alice, VOICES.bella];
const MALE_VOICE_POOL = [VOICES.george, VOICES.daniel, VOICES.eric, VOICES.charlie];

/** Track assigned voices within a session to ensure uniqueness */
const sessionVoiceAssignments = new Map<string, string>();

/**
 * Get the ElevenLabs voice ID for a persona.
 * Priority: exact name match → partial name match → round-robin from pool.
 */
export function getVoiceIdForPersona(personaName: string, personaIndex?: number): string {
  // 1. Exact name match
  if (EXACT_NAME_MAP[personaName]) {
    return EXACT_NAME_MAP[personaName];
  }

  // 2. Already assigned in this session
  if (sessionVoiceAssignments.has(personaName)) {
    return sessionVoiceAssignments.get(personaName)!;
  }

  // 3. Partial first-name match against known names
  for (const [name, voiceId] of Object.entries(EXACT_NAME_MAP)) {
    if (personaName.toLowerCase().includes(name.split(" ")[0].toLowerCase())) {
      const alreadyUsed = new Set(sessionVoiceAssignments.values());
      if (!alreadyUsed.has(voiceId)) {
        sessionVoiceAssignments.set(personaName, voiceId);
        return voiceId;
      }
    }
  }

  // 4. Round-robin: alternate female/male for variety
  const alreadyUsed = new Set(sessionVoiceAssignments.values());
  const idx = personaIndex ?? sessionVoiceAssignments.size;
  const pool = idx % 2 === 0 ? FEMALE_VOICE_POOL : MALE_VOICE_POOL;

  for (const v of pool) {
    if (!alreadyUsed.has(v)) {
      sessionVoiceAssignments.set(personaName, v);
      return v;
    }
  }

  // Fallback: any unused voice
  const allVoices = [...FEMALE_VOICE_POOL, ...MALE_VOICE_POOL];
  for (const v of allVoices) {
    if (!alreadyUsed.has(v)) {
      sessionVoiceAssignments.set(personaName, v);
      return v;
    }
  }

  return VOICES.eric;
}

/** Reset voice assignments between sessions */
export function resetVoiceAssignments(): void {
  sessionVoiceAssignments.clear();
}

export interface SpeechOptions {
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
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
 * Get emotion-tuned voice settings for TTS.
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
