import { describe, it, expect } from "vitest";

describe("ElevenLabs API Key Validation", () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  it("should have ELEVENLABS_API_KEY set", () => {
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);
  });

  it("should authenticate successfully and list voices", async () => {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey!,
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.voices).toBeDefined();
    expect(Array.isArray(data.voices)).toBe(true);
    expect(data.voices.length).toBeGreaterThan(0);

    // Log available voices for selection
    const voices = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      labels: v.labels,
    }));
    console.log("Available voices:", JSON.stringify(voices.slice(0, 10), null, 2));
  });
});
