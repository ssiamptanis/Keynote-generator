import {
  FALLBACK_ICON_NAMES,
  FALLBACK_ILLUSTRATIONS,
  FALLBACK_LOGO_PATHS,
  fallbackIconPath,
  fallbackIllustrationPath,
  REPO_RAW,
  type IconVariant,
  type LogoVariant,
} from "./designAssets";

// Live sync with https://github.com/ssiamptanis/gwi-design-system.
//
// Freshness comes from two layers, cheapest first:
//  1. A GitHub webhook on that repo hits a Render deploy hook on every push
//     (see README "Design system sync"), which redeploys this app. A fresh
//     deploy has a cold cache, so the very first request re-fetches
//     everything below straight away.
//  2. As a fallback in case a webhook delivery is ever missed, every fetch
//     here uses Next's revalidate cache with a 1-hour window, so the app
//     self-heals within an hour even with zero webhook activity.
//
// We deliberately run unauthenticated against the GitHub API (60 req/hr per
// IP) rather than requiring a token — with the caching above this app makes
// on the order of 1-2 GitHub API calls per redeploy/hour, nowhere close to
// the limit. If that ever changes, add GITHUB_TOKEN and pass it as an
// Authorization header below.

const OWNER = "ssiamptanis";
const REPO = "gwi-design-system";
const BRANCH = "main";
const REVALIDATE_SECONDS = 60 * 60; // 1 hour

// Illustration categories/filenames matching any of these (case-insensitive
// substring match) are excluded from what the generator can pick — seasonal
// or otherwise too niche for an arbitrary internal deck. New illustrations
// the design team adds show up automatically unless they hit one of these.
const ILLUSTRATION_BLOCKLIST = [
  "christmas",
  "halloween",
  "dracula",
  "ghost",
  "valentine",
  "easter",
  "raffle",
  "gay pride",
  "tom smith",
  "santa",
];

export interface ResolvedIconUrls {
  white?: string;
  black?: string;
  pink?: string;
}

export interface ResolvedIllustration {
  id: string;
  category: string;
  url: string;
}

export interface DesignSystemManifest {
  iconNames: string[];
  icons: Map<string, ResolvedIconUrls>;
  illustrations: ResolvedIllustration[];
  logos: Record<LogoVariant, string>;
  /** Raw contents of colors_and_type.css, live from the repo. Empty string if unavailable. */
  css: string;
  source: "live" | "fallback";
}

function rawUrl(path: string): string {
  return `${REPO_RAW}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

interface GithubTreeEntry {
  path: string;
  type: string;
}

async function fetchTree(): Promise<GithubTreeEntry[] | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "gwi-keynote-generator" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json.tree)) return null;
    return json.tree as GithubTreeEntry[];
  } catch {
    return null;
  }
}

async function fetchCss(): Promise<string | null> {
  try {
    const res = await fetch(`${REPO_RAW}/colors_and_type.css`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const ICON_PATH_RE = /^assets\/Icons\/Icon=(.+), Colour=On (white|black|pink)\.svg$/;
const ILLUSTRATION_PATH_RE = /^assets\/Illustrations\/On white\/([^/]+)\/([^/]+\.svg)$/;
const LOGO_PATH_RE = /^assets\/logos\/gwi-logo-(on-white|on-black|mono-white|mono-black)\.svg$/;

function isBlockedIllustration(category: string, file: string): boolean {
  const stem = file.replace(/\.svg$/i, "");
  if (/^\d+$/.test(stem.trim())) return true; // junk/placeholder numeric filenames
  const haystack = `${category} ${file}`.toLowerCase();
  return ILLUSTRATION_BLOCKLIST.some((kw) => haystack.includes(kw));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFromTree(tree: GithubTreeEntry[]) {
  const icons = new Map<string, ResolvedIconUrls>();
  const illustrations: ResolvedIllustration[] = [];
  const logos: Partial<Record<LogoVariant, string>> = {};

  for (const entry of tree) {
    if (entry.type !== "blob") continue;

    const iconMatch = entry.path.match(ICON_PATH_RE);
    if (iconMatch) {
      const [, name, variant] = iconMatch;
      const existing = icons.get(name) || {};
      existing[variant as IconVariant] = rawUrl(entry.path);
      icons.set(name, existing);
      continue;
    }

    const illustrationMatch = entry.path.match(ILLUSTRATION_PATH_RE);
    if (illustrationMatch) {
      const [, category, file] = illustrationMatch;
      if (isBlockedIllustration(category, file)) continue;
      illustrations.push({
        id: slugify(`${category}-${file.replace(/\.svg$/i, "")}`),
        category,
        url: rawUrl(entry.path),
      });
      continue;
    }

    const logoMatch = entry.path.match(LOGO_PATH_RE);
    if (logoMatch) {
      logos[logoMatch[1] as LogoVariant] = rawUrl(entry.path);
    }
  }

  return { icons, illustrations, logos };
}

function buildFallbackManifest(css: string): DesignSystemManifest {
  const icons = new Map<string, ResolvedIconUrls>();
  for (const name of FALLBACK_ICON_NAMES) {
    icons.set(name, {
      white: rawUrl(fallbackIconPath(name, "white")),
      black: rawUrl(fallbackIconPath(name, "black")),
      pink: rawUrl(fallbackIconPath(name, "pink")),
    });
  }

  const illustrations = FALLBACK_ILLUSTRATIONS.map((e) => ({
    id: e.id,
    category: e.category,
    url: rawUrl(fallbackIllustrationPath(e)),
  }));

  const logos = Object.fromEntries(
    Object.entries(FALLBACK_LOGO_PATHS).map(([variant, path]) => [variant, rawUrl(path)])
  ) as Record<LogoVariant, string>;

  return { iconNames: FALLBACK_ICON_NAMES, icons, illustrations, logos, css, source: "fallback" };
}

async function buildManifest(): Promise<DesignSystemManifest> {
  const [tree, css] = await Promise.all([fetchTree(), fetchCss()]);

  if (!tree) {
    return buildFallbackManifest(css ?? "");
  }

  const { icons, illustrations, logos } = buildFromTree(tree);

  if (icons.size === 0 || illustrations.length === 0) {
    // The naming convention in the repo no longer matches what we parse for
    // (likely a brand-refresh rename) — fall back rather than ship an
    // empty icon/illustration pool. Update the *_PATH_RE regexes above once
    // you know the new pattern.
    return buildFallbackManifest(css ?? "");
  }

  const resolvedLogos: Record<LogoVariant, string> = {
    "on-white": logos["on-white"] || rawUrl(FALLBACK_LOGO_PATHS["on-white"]),
    "on-black": logos["on-black"] || rawUrl(FALLBACK_LOGO_PATHS["on-black"]),
    "mono-white": logos["mono-white"] || rawUrl(FALLBACK_LOGO_PATHS["mono-white"]),
    "mono-black": logos["mono-black"] || rawUrl(FALLBACK_LOGO_PATHS["mono-black"]),
  };

  return {
    iconNames: Array.from(icons.keys()).sort(),
    icons,
    illustrations,
    logos: resolvedLogos,
    css: css ?? "",
    source: "live",
  };
}

// Next's fetch() cache already dedupes/persists across requests in
// production; this in-memory promise just avoids redoing the regex parsing
// for multiple concurrent requests within the same server instance.
let cachedManifest: Promise<DesignSystemManifest> | null = null;

export async function getDesignSystemManifest(): Promise<DesignSystemManifest> {
  if (!cachedManifest) {
    cachedManifest = buildManifest();
  }
  return cachedManifest;
}

// Pulls every `--custom-property: value;` declaration out of the live CSS
// so it can be applied as an inline style on <html> — inline styles win the
// cascade over any stylesheet regardless of load/injection order, so brand
// colours/spacing/type-scale update reliably even if the <style> tag
// carrying the full live stylesheet ends up ordered oddly in <head>.
export function extractCssVariables(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}
