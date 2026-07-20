"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import TopNav from "@/components/TopNav";

export default function GeneratePage() {
  const router = useRouter();
  const [docUrl, setDocUrl] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [slideCount, setSlideCount] = useState(12);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docUrl, audience, tone, slideCount }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Something went wrong.");
      }
      router.push(`/deck/${json.id}`);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-grey-1">
      <TopNav />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-off-black tracking-tight mb-2">New presentation</h1>
        <p className="text-grey-7 mb-10">
          Paste a Google Doc link — set sharing to &ldquo;Anyone with the link can view&rdquo; first — and
          we&apos;ll turn it into a keynote-style deck.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field label="Google Doc link" required>
            <input
              type="url"
              required
              placeholder="https://docs.google.com/document/d/..."
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="w-full rounded-md border border-grey-4 bg-white px-4 py-3 outline-none focus:border-hot-pink"
            />
          </Field>

          <Field label="Audience (optional)">
            <input
              type="text"
              placeholder="e.g. exec leadership team"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-md border border-grey-4 bg-white px-4 py-3 outline-none focus:border-hot-pink"
            />
          </Field>

          <Field label="Tone (optional)">
            <input
              type="text"
              placeholder="e.g. urgent and direct, or optimistic"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-md border border-grey-4 bg-white px-4 py-3 outline-none focus:border-hot-pink"
            />
          </Field>

          <Field label="Target slide count">
            <input
              type="number"
              min={4}
              max={30}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-32 rounded-md border border-grey-4 bg-white px-4 py-3 outline-none focus:border-hot-pink"
            />
          </Field>

          {status === "error" && <p className="text-error text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="self-start rounded-md bg-hot-pink px-8 py-3 text-white font-semibold disabled:opacity-60"
          >
            {status === "loading" ? "Generating..." : "Generate presentation"}
          </button>
          {status === "loading" && (
            <p className="text-grey-6 text-sm">This can take up to a minute for longer docs.</p>
          )}
        </form>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-off-black">
        {label} {required && <span className="text-hot-pink">*</span>}
      </span>
      {children}
    </label>
  );
}
