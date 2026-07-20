import Anthropic from "@anthropic-ai/sdk";
import type { Deck, ResolvedIcon, Slide } from "./types";
import { getDesignSystemManifest, type DesignSystemManifest, type ResolvedIllustration } from "./designSystem";

function buildSystemPrompt(manifest: DesignSystemManifest): string {
  const iconList = manifest.iconNames.join(", ");
  const illustrationList = manifest.illustrations
    .map((i) => `${i.id} (${i.category})`)
    .join("\n");

  return `You turn a source document into a keynote-style slide deck — think Steve Jobs / Apple keynote pacing, not a dense corporate slide dump. Every deck follows GWI's real, current brand assets.

Rules for the deck:
- One idea per slide. Ruthlessly cut. If a paragraph has three points, that's three slides, not one crowded slide.
- Open with a "title" slide and close with a "closing" slide.
- Use "section" slides to mark major transitions between parts of the narrative.
- Use "stat" slides whenever the source text contains a standout number, percentage, or metric.
- Use "quote" slides for any direct quote in the source (from a person, customer, or exec).
- Use "content" slides (heading + up to 4 short bullets) for the rest — bullets are short phrases, not full sentences.
- Use "comparison" slides only when the source explicitly contrasts two things (before/after, us/them, old/new).
- Use "image" slides to feature a supplied image from the source doc with a short caption, when genuinely relevant (don't force it).
- Tone: bold, clear, human. Short punchy sentences. Sentence case (not Title Case). No corporate jargon, no filler like "leverage" or "synergy". Write like one person talking to another.
- Never invent facts, numbers, or quotes that aren't in the source document.
- Aim for 8-16 slides depending on how much source content there is.

Brand assets — this list is fetched live from the design system repo right now, so it always reflects whatever's current (including after a brand refresh). Use these to reinforce ideas, never as decoration for its own sake:
- "icon" fields (on section/stat/content/comparison-column slides): pick ONE icon name, EXACTLY as spelled, from this list, only when it clearly reinforces that slide's point — most slides don't need one:
${iconList}
- "illustration" fields (on title/closing slides only): pick ONE id, EXACTLY as spelled, from this list, only when it fits the moment (e.g. don't put an office/water-cooler illustration on a slide about security). Leave it out rather than force a bad fit:
${illustrationList}
- Never invent an icon name or illustration id that isn't in these lists. Omit the field entirely if nothing fits.

Respond with ONLY valid JSON matching this TypeScript type — no markdown fences, no commentary:

type Deck = {
  title: string;
  subtitle?: string;
  slides: Array<
    | { type: "title"; heading: string; subheading?: string; illustration?: string }
    | { type: "section"; eyebrow?: string; heading: string; icon?: string }
    | { type: "stat"; stat: string; copy: string; source?: string; icon?: string }
    | { type: "quote"; quote: string; attributionName?: string; attributionRole?: string }
    | { type: "content"; heading: string; bullets: string[]; imageUrl?: string; icon?: string }
    | { type: "comparison"; heading: string; left: { heading: string; bullets: string[]; icon?: string }; right: { heading: string; bullets: string[]; icon?: string } }
    | { type: "image"; heading?: string; imageUrl: string; caption?: string }
    | { type: "closing"; heading: string; lede?: string; illustration?: string }
  >;
};`;
}

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

// Raw shape Claude actually returns (icon/illustration as bare names/ids,
// not yet resolved to URLs).
type RawDeck = {
  title: string;
  subtitle?: string;
  slides: Array<Record<string, any>>;
};

export async function generateDeck(input: GenerateDeckInput): Promise<Deck> {
  const client = getClient();
  const manifest = await getDesignSystemManifest();

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
    system: buildSystemPrompt(manifest),
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude didn't return any text content.");
  }

  const raw = textBlock.text.trim();
  const jsonText = stripCodeFence(raw);

  let rawDeck: RawDeck;
  try {
    rawDeck = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("Claude's response wasn't valid JSON. Try generating again.");
  }

  if (!rawDeck.title || !Array.isArray(rawDeck.slides) || rawDeck.slides.length === 0) {
    throw new Error("Generated deck is missing required fields. Try generating again.");
  }

  const deck: Deck = {
    title: rawDeck.title,
    subtitle: rawDeck.subtitle,
    slides: rawDeck.slides.map((s) => resolveSlideAssets(s, manifest)),
  };

  return deck;
}

// Turns the bare icon name / illustration id Claude returned into the
// concrete, absolute URLs Slide.tsx renders — and drops anything that
// isn't in the live manifest instead of failing the whole generation over
// a hallucinated name.
function resolveSlideAssets(raw: Record<string, any>, manifest: DesignSystemManifest): Slide {
  const s: any = { ...raw };

  if (typeof s.icon === "string") {
    s.icon = resolveIcon(s.icon, manifest);
  }
  if (typeof s.illustration === "string") {
    const url = resolveIllustration(s.illustration, manifest);
    delete s.illustration;
    if (url) s.illustrationUrl = url;
  }

  if (s.type === "comparison") {
    if (s.left && typeof s.left.icon === "string") s.left.icon = resolveIcon(s.left.icon, manifest);
    if (s.right && typeof s.right.icon === "string") s.right.icon = resolveIcon(s.right.icon, manifest);
  }

  return s as Slide;
}

function resolveIcon(name: string, manifest: DesignSystemManifest): ResolvedIcon | undefined {
  const canonical = manifest.iconNames.find((n) => n.toLowerCase() === name.trim().toLowerCase());
  if (!canonical) return undefined;
  const urls = manifest.icons.get(canonical);
  if (!urls) return undefined;
  return { name: canonical, url: urls };
}

function resolveIllustration(id: string, manifest: DesignSystemManifest): string | undefined {
  const entry: ResolvedIllustration | undefined = manifest.illustrations.find(
    (i) => i.id.toLowerCase() === id.trim().toLowerCase()
  );
  return entry?.url;
}

function stripCodeFence(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenceMatch ? fenceMatch[1] : text;
}
