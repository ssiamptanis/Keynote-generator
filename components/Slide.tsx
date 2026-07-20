import type { Slide as SlideT } from "@/lib/types";

// Renders a single 1280x720 "stage" following the GWI slide templates
// (see .claude/skills/gwi-design-system/slides/*.html for the source
// reference this was adapted from). Every slide type keeps to the house
// rules: no page numbers, no shadows, no gradients, no arrows on CTAs,
// sentence case, headline weight capped at Bold (700).

const stageBase =
  "relative w-[1280px] h-[720px] shrink-0 overflow-hidden font-faktum box-border slide-page";

function Logo({ variant = "on-black" }: { variant?: "on-black" | "on-white" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/logos/gwi-logo-${variant}.svg`} alt="GWI" className="h-[18px] w-auto block" />
  );
}

export default function Slide({ slide }: { slide: SlideT }) {
  switch (slide.type) {
    case "title":
      return (
        <div className={`${stageBase} bg-off-black text-white p-20 flex flex-col justify-between`}>
          <div />
          <div>
            <h1 className="text-[88px] leading-[0.95] tracking-[-0.03em] font-bold max-w-[90%] mb-6">
              {slide.heading}
            </h1>
            {slide.subheading && (
              <p className="text-[26px] leading-[1.3] font-normal max-w-[760px]">{slide.subheading}</p>
            )}
          </div>
          <div className="flex justify-between items-end">
            <Logo variant="on-black" />
            <span />
          </div>
        </div>
      );

    case "section":
      return (
        <div className={`${stageBase} bg-hot-pink text-white p-20`}>
          {slide.eyebrow && (
            <div className="absolute top-20 left-20 text-[14px] font-bold uppercase tracking-[0.16em]">
              {slide.eyebrow}
            </div>
          )}
          <h1 className="absolute left-20 right-20 top-1/2 -translate-y-1/2 text-[110px] leading-[0.95] tracking-[-0.03em] font-bold max-w-[80%]">
            {slide.heading}
          </h1>
          <div className="absolute bottom-9 left-20 right-20 flex justify-between items-center">
            <Logo variant="on-white" />
          </div>
        </div>
      );

    case "stat":
      return (
        <div className={`${stageBase} bg-white p-20 flex flex-col justify-center gap-9`}>
          <div className="text-hot-pink font-normal text-[280px] leading-[0.85] tracking-[-0.05em]">
            {slide.stat}
          </div>
          <p className="text-off-black font-bold text-[36px] leading-[1.15] tracking-[-0.02em] max-w-[780px]">
            {slide.copy}
          </p>
          <div className="absolute left-20 right-20 bottom-9 flex items-center gap-6 text-[12px] text-grey-7">
            <Logo variant="on-white" />
            {slide.source && <span className="leading-[1.4]">Source: {slide.source}</span>}
          </div>
        </div>
      );

    case "quote":
      return (
        <div className={`${stageBase} bg-off-black text-white p-[90px] flex flex-col justify-center`}>
          <div className="text-[54px] leading-[1.1] tracking-[-0.02em] font-medium max-w-[1000px] mb-10">
            &ldquo;{slide.quote}&rdquo;
          </div>
          {(slide.attributionName || slide.attributionRole) && (
            <div className="flex items-center gap-[18px]">
              {slide.attributionName && (
                <div className="w-16 h-16 rounded-full bg-violet flex items-center justify-center font-bold text-[22px]">
                  {initials(slide.attributionName)}
                </div>
              )}
              <div>
                {slide.attributionName && <div className="font-bold text-[18px] leading-[1.3]">{slide.attributionName}</div>}
                {slide.attributionRole && <div className="text-[13px] text-grey-5 mt-0.5">{slide.attributionRole}</div>}
              </div>
            </div>
          )}
          <div className="absolute left-[90px] right-[90px] bottom-9">
            <Logo variant="on-black" />
          </div>
        </div>
      );

    case "content":
      return (
        <div className={`${stageBase} bg-white p-20 flex flex-col justify-center`}>
          <h2 className="text-[52px] leading-[1.02] tracking-[-0.02em] font-bold text-off-black mb-10 max-w-[900px]">
            {slide.heading}
          </h2>
          <div className={`flex ${slide.imageUrl ? "gap-16 items-center" : ""}`}>
            <ul className={`flex flex-col gap-5 ${slide.imageUrl ? "flex-1" : "max-w-[820px]"}`}>
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-4 text-[26px] leading-[1.3] text-off-black font-normal">
                  <span className="w-2.5 h-2.5 rounded-full bg-hot-pink mt-3 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {slide.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.imageUrl} alt="" className="flex-1 max-h-[420px] object-contain rounded-md" />
            )}
          </div>
          <div className="absolute left-20 right-20 bottom-9">
            <Logo variant="on-white" />
          </div>
        </div>
      );

    case "comparison":
      return (
        <div className={`${stageBase} bg-white p-20 flex flex-col`}>
          <h2 className="text-[44px] leading-[1.02] tracking-[-0.02em] font-bold text-off-black mb-12">
            {slide.heading}
          </h2>
          <div className="flex-1 grid grid-cols-2 gap-10">
            <ComparisonCol col={slide.left} accent="grey" />
            <ComparisonCol col={slide.right} accent="pink" />
          </div>
          <div className="absolute left-20 right-20 bottom-9">
            <Logo variant="on-white" />
          </div>
        </div>
      );

    case "image":
      return (
        <div className={`${stageBase} bg-off-black text-white p-16 flex flex-col`}>
          {slide.heading && (
            <h2 className="text-[36px] leading-[1.1] font-bold mb-6 max-w-[900px]">{slide.heading}</h2>
          )}
          <div className="flex-1 flex items-center justify-center min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt={slide.caption || ""} className="max-h-full max-w-full object-contain" />
          </div>
          {slide.caption && <p className="text-[14px] text-grey-5 mt-4">{slide.caption}</p>}
        </div>
      );

    case "closing":
      return (
        <div className={`${stageBase} bg-off-black text-white p-[90px] flex flex-col justify-center`}>
          <h1 className="text-[104px] leading-[0.92] tracking-[-0.03em] font-bold mb-8 max-w-[1000px]">
            {slide.heading}
          </h1>
          {slide.lede && (
            <p className="text-[24px] leading-[1.3] font-normal mb-12 max-w-[680px]">{slide.lede}</p>
          )}
          <Logo variant="on-black" />
        </div>
      );

    default:
      return null;
  }
}

function ComparisonCol({ col, accent }: { col: { heading: string; bullets: string[] }; accent: "grey" | "pink" }) {
  return (
    <div className={`rounded-md p-8 ${accent === "pink" ? "bg-hot-pink-bg" : "bg-grey-2"}`}>
      <h3 className="text-[24px] font-bold text-off-black mb-5">{col.heading}</h3>
      <ul className="flex flex-col gap-3">
        {col.bullets.map((b, i) => (
          <li key={i} className="text-[18px] leading-[1.4] text-off-black">
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
