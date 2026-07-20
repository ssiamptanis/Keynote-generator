import type { Metadata } from "next";
import "./globals.css";
import { getDesignSystemManifest, extractCssVariables } from "@/lib/designSystem";
import { DesignSystemProvider } from "@/components/DesignSystemProvider";

export const metadata: Metadata = {
  title: "Keynote Generator | GWI",
  description: "Turn a Google Doc into a keynote-style presentation.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pulls the live design system (colors_and_type.css + logo URLs) from
  // github.com/ssiamptanis/gwi-design-system. See lib/designSystem.ts for
  // the caching/fallback strategy — this never blocks on a slow/broken
  // fetch for more than the cache window, and always has a static
  // last-known-good snapshot (app/globals.css) to fall back to.
  const manifest = await getDesignSystemManifest();
  const rootVars = extractCssVariables(manifest.css);

  return (
    <html lang="en" style={rootVars as React.CSSProperties}>
      <body>
        {/*
          The live stylesheet, verbatim, straight from the repo. This
          catches anything beyond plain variables (updated @font-face
          src URLs, new/changed semantic classes) — the inline `style`
          above on <html> is the belt-and-suspenders guarantee for the
          custom-property values specifically, since inline styles always
          win the cascade regardless of where this tag lands in the DOM.
        */}
        {manifest.css && <style dangerouslySetInnerHTML={{ __html: manifest.css }} />}
        <DesignSystemProvider logos={manifest.logos}>{children}</DesignSystemProvider>
      </body>
    </html>
  );
}
