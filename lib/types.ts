// Shared slide schema. This is the contract between the Claude generator
// (lib/claude.ts), the DB (supabase/schema.sql, presentations.slides jsonb)
// and the renderer (components/Slide.tsx).

export type SlideType =
  | "title"
  | "section"
  | "stat"
  | "quote"
  | "content"
  | "comparison"
  | "image"
  | "closing";

export interface BaseSlide {
  type: SlideType;
}

// Icon/illustration references are resolved to concrete, absolute URLs at
// GENERATION time (lib/claude.ts, against the live manifest from
// lib/designSystem.ts) and stored that way in the deck's jsonb — not as
// abstract names re-looked-up at render time. Two reasons:
//  1. Slide.tsx (client-rendered) doesn't need to fetch/know the design
//     system manifest at all — it just renders whatever URL is here.
//  2. A deck someone generated last month keeps pointing at the exact
//     asset it was built with, even if a brand refresh later renames or
//     removes that file — old presentations don't silently break.
// The one exception is the logo, which is deliberately NOT frozen per-deck
// (see components/DesignSystemProvider.tsx) since it's the app's current
// brand mark, not a piece of that deck's content.
export interface ResolvedIcon {
  name: string;
  url: { white?: string; black?: string; pink?: string };
}

export interface TitleSlide extends BaseSlide {
  type: "title";
  heading: string;
  subheading?: string;
  illustrationUrl?: string;
}

export interface SectionSlide extends BaseSlide {
  type: "section";
  eyebrow?: string;
  heading: string;
  icon?: ResolvedIcon;
}

export interface StatSlide extends BaseSlide {
  type: "stat";
  stat: string; // e.g. "68%"
  copy: string;
  source?: string;
  icon?: ResolvedIcon;
}

export interface QuoteSlide extends BaseSlide {
  type: "quote";
  quote: string;
  attributionName?: string;
  attributionRole?: string;
}

export interface ContentSlide extends BaseSlide {
  type: "content";
  heading: string;
  bullets: string[];
  imageUrl?: string;
  icon?: ResolvedIcon;
}

export interface ComparisonSlide extends BaseSlide {
  type: "comparison";
  heading: string;
  left: { heading: string; bullets: string[]; icon?: ResolvedIcon };
  right: { heading: string; bullets: string[]; icon?: ResolvedIcon };
}

export interface ImageSlide extends BaseSlide {
  type: "image";
  heading?: string;
  imageUrl: string;
  caption?: string;
}

export interface ClosingSlide extends BaseSlide {
  type: "closing";
  heading: string;
  lede?: string;
  illustrationUrl?: string;
}

export type Slide =
  | TitleSlide
  | SectionSlide
  | StatSlide
  | QuoteSlide
  | ContentSlide
  | ComparisonSlide
  | ImageSlide
  | ClosingSlide;

export interface Deck {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

export interface PresentationRow {
  id: string;
  title: string;
  subtitle: string | null;
  slides: Slide[];
  source_doc_url: string | null;
  created_by: string;
  created_at: string;
}
