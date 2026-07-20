import Anthropic from "@anthropic-ai/sdk";
import type { Deck } from "./types";

const SYSTEM_PROMPT = `You turn a source document into a keynote-style slide deck — think Steve Jobs / Apple keynote pacing, not a dense corporate slide dump.

Rules for the deck:
- One idea per slide. Ruthlessly cut. If a paragraph has three points, that's three slides, not one crowded slide.
- Open with a "title" slide and close with a "closing" slide.
- Use "section" slides to mark major transitions between parts of the narrative.
- Use "stat" slides whenever the source text contains a standout number, percentage, or metric.
- Use "quote" slides for any direct quote in the source (from a person, customer, or exec).
- Use "content" slides (heading + up to 4 short bullets) for the rest — bullets are short phrases, not full sentences.
- Use "comparison" slides only when the source explicitly contrasts two things (before/after, us/them, old/new).
- Use "image" slides to feature a supplied image with a short caption, when an image is genuinely relevant to that point (don't force it).
- Tone: bold, clear, human. Short punchy sentences. Sentence case (not Title Case). No corporate jargon, no filler like "leverage" or "synergy". Write like one person talking to another.
- Never invent facts, numbers, or quotes that aren't in the source document.
- Aim for 8-16 slides depending on how much source content there is.

Respond with ONLY valid JSON matching this TypeScript type — no markdown fences, no commentary:

type Deck = {
  title: string;
  subtitle?: string;
  slides: Array<
    | { type: "title"; heading: string; subheading?: string }
    | { type: "section"; eyebrow?: string; heading: string }
    | { type: "stat"; stat: string; copy: string; source?: string }
    | { type: "quote"; quote: string; attributionName?: string; attributionRole?: string }
    | { type: "content"; heading: string; bullets: string[]; imageUrl?: string }
    | { type: "comparison"; heading: string; left: { heading: string; bullets: string[] }; right: { heading: string; bullets: string[] } }
    | { type: "image"; heading?: string; imageUrl: string; caption?: string }
    | { type: "closing"; heading: string; lede?: string }
  >;
};`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server.");
  }
  return new Anthropic({ apiKey });
}

export interface GenerateDeckInput {
  docTitle: string;
  docText: string;
  images: string[];
  audience?: string;
  tone?: string;
  slideCountHint?: number;
}

export async function generateDeck(input: GenerateDeckInput): Promise<Deck> {
  const client = getClient();

  const userPrompt = [
    `Source document title: ${input.docTitle}`,
    input.audience ? `Intended audience: ${input.audience}` : null,
    input.tone ? `Requested tone: ${input.tone}` : null,
    input.slideCountHint ? `Target roughly ${input.slideCountHint} slides.` : null,
    input.images.length
      ? `Images available from the source doc (use these exact URLs verbatim in "imageUrl" fields, never invent new ones):\n${input.images.join("\n")}`
      : "No images were found in the source doc — do not use any \"image\" slides.",
    "",
    "Source document content:",
    input.docText,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude didn't return any text content.");
  }

  const raw = textBlock.text.trim();
  const jsonText = stripCodeFence(raw);

  let deck: Deck;
  try {
    deck = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("Claude's response wasn't valid JSON. Try generating again.");
  }

  if (!deck.title || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    throw new Error("Generated deck is missing required fields. Try generating again.");
  }

  return deck;
}

function stripCodeFence(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenceMatch ? fenceMatch[1] : text;
}
