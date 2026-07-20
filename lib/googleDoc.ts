import * as cheerio from "cheerio";

export interface ParsedDoc {
  title: string;
  // Flattened text content, headings marked with a leading "# "/"## " so
  // the LLM can see document structure.
  text: string;
  images: string[];
}

/**
 * Pulls the Google Doc file ID out of any of the common share-link shapes:
 *   https://docs.google.com/document/d/<ID>/edit?usp=sharing
 *   https://docs.google.com/document/d/<ID>/view
 *   https://docs.google.com/document/d/<ID>
 */
export function extractDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Fetches a publicly viewable ("Anyone with the link can view") Google Doc
 * as HTML via Google's export endpoint, then extracts plain text (keeping
 * heading structure) and any embedded image URLs.
 *
 * This intentionally avoids OAuth — it only works for docs shared with
 * "Anyone with the link". If the doc is private, Google returns a
 * sign-in/HTML error page instead of the document, which we detect and
 * surface as a clear error.
 */
export async function fetchGoogleDoc(shareUrl: string): Promise<ParsedDoc> {
  const docId = extractDocId(shareUrl);
  if (!docId) {
    throw new Error(
      "That doesn't look like a Google Docs link. Expected something like https://docs.google.com/document/d/<id>/edit"
    );
  }

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
  const res = await fetch(exportUrl, { redirect: "follow" });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Couldn't access that doc. Set sharing to \"Anyone with the link can view\" and try again."
    );
  }
  if (!res.ok) {
    throw new Error(`Couldn't fetch the doc (status ${res.status}). Check the link and sharing settings.`);
  }

  const html = await res.text();

  // Google redirects to a sign-in page for private docs but still returns
  // 200; detect that case by checking for the accounts.google.com sign-in
  // markup instead of document content.
  if (html.includes("accounts.google.com/ServiceLogin") || html.includes("id=\"gaia_loginform\"")) {
    throw new Error(
      "That doc is private. Set sharing to \"Anyone with the link can view\" and try again."
    );
  }

  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || "Untitled document";

  const lines: string[] = [];
  const images: string[] = [];

  $("body")
    .find("h1, h2, h3, h4, p, li, img")
    .each((_, el) => {
      const tag = (el as any).tagName?.toLowerCase();
      if (tag === "img") {
        const src = $(el).attr("src");
        if (src) images.push(src);
        return;
      }
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (!text) return;

      if (tag === "h1") lines.push(`# ${text}`);
      else if (tag === "h2") lines.push(`## ${text}`);
      else if (tag === "h3" || tag === "h4") lines.push(`### ${text}`);
      else lines.push(text);
    });

  const text = lines.join("\n");

  if (!text.trim()) {
    throw new Error("That doc appears to be empty (or we couldn't read its content).");
  }

  return { title, text, images: images.slice(0, 20) };
}
