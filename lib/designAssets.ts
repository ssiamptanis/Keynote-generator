// Static fallback data for the GWI design system
// (github.com/ssiamptanis/gwi-design-system).
//
// lib/designSystem.ts pulls the live list of icons/illustrations/logos and
// the live colors_and_type.css straight from that repo at runtime. This
// file is ONLY the safety net: if that live fetch fails (network blip,
// GitHub outage, or a brand refresh changes the file-naming convention so
// our parser matches nothing), designSystem.ts falls back to this snapshot
// so the app keeps working with a best-effort, slightly-stale asset set
// instead of breaking.
//
// You shouldn't normally need to touch this file — it exists purely as a
// backstop, not the source of truth.

export const REPO_RAW = "https://raw.githubusercontent.com/ssiamptanis/gwi-design-system/main";

export function encodePath(...segments: string[]): string {
  return segments.map((s) => encodeURIComponent(s)).join("/");
}

// ---------- Logo ----------

export type LogoVariant = "on-white" | "on-black" | "mono-white" | "mono-black";

export const FALLBACK_LOGO_PATHS: Record<LogoVariant, string> = {
  "on-white": "assets/logos/gwi-logo-on-white.svg",
  "on-black": "assets/logos/gwi-logo-on-black.svg",
  "mono-white": "assets/logos/gwi-logo-mono-white.svg",
  "mono-black": "assets/logos/gwi-logo-mono-black.svg",
};

// ---------- Icons ----------

export type IconVariant = "white" | "black" | "pink";

export const FALLBACK_ICON_NAMES: string[] = [
  "AI", "Analysis", "Audience", "Bag", "Bar chart", "Basketball", "Battery empty",
  "Battery full", "Beer", "Binoculars", "Briefcase", "Browser", "Brush", "Burger",
  "Calculator", "Calendar", "Camera", "Car wheel", "Cassette", "Chat", "Check",
  "Cherries", "Clock", "Cocktail", "Code", "Coffee", "Compass", "Connecting the dots",
  "Contact", "Credit card", "Cross", "Cursor", "Cutlery", "Cycle", "Desk lamp", "Dial",
  "Diamond", "Document", "Donut chart", "Download", "Earpods", "Email", "Exercise Bike",
  "Fast", "Fingerprint", "First aid", "Flower", "Focus", "Folder", "Game controller",
  "Gear", "Glasses", "Globe", "Gym weight", "Hashtag", "Heart", "Heartbeat", "Home",
  "Hourglass", "ID", "Image", "Integration", "Kettlebell", "Key", "Lanyard", "Leaf",
  "Lifebuoy", "Lightbulb", "Location marker", "Loudspeaker", "Map", "Maze",
  "Measuring tape", "Medal", "Microchip", "Microphone", "Microscope",
  "Money - Bitcoin", "Money - Dollar", "Money - Euro", "Money - Pound", "Mouse",
  "Music note", "Notebook", "Packman", "Paw", "Pen", "Pencil", "Percentage", "Pill",
  "Planet", "Platform", "Play button", "Portable speaker", "Price tag",
  "Publication - Online", "Publication - Print", "Question mark", "Quotes", "Radio",
  "Remote control", "Save disk", "Science", "Secure", "Server", "Shoe",
  "Smart watch", "Smartphone", "Spark", "Speaker", "Speech bubble",
  "Speech bubble heart", "Stand out", "Star", "Stopwatch", "Strategy", "T-shirt",
  "TV", "Table", "Target", "Telephone", "Ticket", "Unsecured", "User", "Video",
  "Vinyl", "Wallet", "Warning", "Watch", "Weather", "WiFi", "Wrench",
];

export function fallbackIconPath(name: string, variant: IconVariant): string {
  return `assets/Icons/Icon=${name}, Colour=On ${variant}.svg`;
}

// ---------- Illustrations ----------

export interface IllustrationEntry {
  id: string;
  category: string;
  file: string;
}

export const FALLBACK_ILLUSTRATIONS: IllustrationEntry[] = [
  { id: "platform-audiences", category: "Platform", file: "Platform - Audiences.svg" },
  { id: "platform-canvas", category: "Platform", file: "Platform - Canvas.svg" },
  { id: "platform-charts", category: "Platform", file: "Platform - Charts.svg" },
  { id: "platform-cross-tabs", category: "Platform", file: "Platform - Cross tabs.svg" },
  { id: "platform-dashboards", category: "Platform", file: "Platform - Dashboards.svg" },
  { id: "platform-general", category: "Platform", file: "Platform - General GWI.svg" },
  { id: "platform-workspace", category: "Platform", file: "Platform - Workspace.svg" },
  { id: "research-hand-platform", category: "Research", file: "Hand with platform.svg" },
  { id: "research-profiling", category: "Research", file: "Profiling.svg" },
  { id: "research-general", category: "Research", file: "Research.svg" },
  { id: "research-showing-data", category: "Research", file: "Showing data.svg" },
  { id: "tech-earpods", category: "Tech", file: "Earpods.svg" },
  { id: "tech-podcast", category: "Tech", file: "Podcast.svg" },
  { id: "tools-calculator", category: "Objects and tools", file: "Calculator.svg" },
  { id: "tools-document", category: "Objects and tools", file: "Document.svg" },
  { id: "office-coworkers", category: "Office", file: "Coworkers at the office.svg" },
  { id: "office-laptop-data", category: "Office", file: "Laptop with data.svg" },
  { id: "office-woman-presenting", category: "Office", file: "Woman presenting.svg" },
  { id: "people-man-waving", category: "People", file: "Man waving.svg" },
  { id: "people-woman-gwi-dot", category: "People", file: "Woman with GWI dot.svg" },
  { id: "audience-profile-1", category: "Audiences", file: "Audience profile 1.svg" },
  { id: "ai-content-creator", category: "AI", file: "AI Content creator.svg" },
];

export function fallbackIllustrationPath(entry: IllustrationEntry): string {
  return `assets/Illustrations/On white/${entry.category}/${entry.file}`;
}
