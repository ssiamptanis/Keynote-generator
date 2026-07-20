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

export interface TitleSlide extends BaseSlide {
  type: "title";
  heading: string;
  subheading?: string;
}

export interface SectionSlide extends BaseSlide {
  type: "section";
  eyebrow?: string;
  heading: string;
}

export interface StatSlide extends BaseSlide {
  type: "stat";
  stat: string; // e.g. "68%"
  copy: string;
  source?: string;
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
}

export interface ComparisonSlide extends BaseSlide {
  type: "comparison";
  heading: string;
  left: { heading: string; bullets: string[] };
  right: { heading: string; bullets: string[] };
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
