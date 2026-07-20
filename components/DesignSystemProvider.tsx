"use client";

import { createContext, useContext } from "react";
import { FALLBACK_LOGO_PATHS, REPO_RAW, type LogoVariant } from "@/lib/designAssets";

// Falls back to the same static logo convention as the server if, for some
// reason, a component ever renders outside <DesignSystemProvider> (it
// shouldn't — app/layout.tsx wraps every page).
const STATIC_DEFAULT_LOGOS: Record<LogoVariant, string> = {
  "on-white": `${REPO_RAW}/${FALLBACK_LOGO_PATHS["on-white"]}`,
  "on-black": `${REPO_RAW}/${FALLBACK_LOGO_PATHS["on-black"]}`,
  "mono-white": `${REPO_RAW}/${FALLBACK_LOGO_PATHS["mono-white"]}`,
  "mono-black": `${REPO_RAW}/${FALLBACK_LOGO_PATHS["mono-black"]}`,
};

const DesignSystemContext = createContext<Record<LogoVariant, string>>(STATIC_DEFAULT_LOGOS);

export function DesignSystemProvider({
  logos,
  children,
}: {
  logos: Record<LogoVariant, string>;
  children: React.ReactNode;
}) {
  return <DesignSystemContext.Provider value={logos}>{children}</DesignSystemContext.Provider>;
}

export function useLogoUrl(variant: LogoVariant): string {
  const logos = useContext(DesignSystemContext);
  return logos[variant];
}
