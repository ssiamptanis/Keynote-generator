"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLogoUrl } from "@/components/DesignSystemProvider";

export default function LoginPage() {
  const logoUrl = useLogoUrl("on-black");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.toLowerCase().endsWith("@gwi.com")) {
      setStatus("error");
      setErrorMsg("Use your @gwi.com email address.");
      return;
    }

    setStatus("sending");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="min-h-screen bg-off-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="GWI" width={84} height={26} />
        </div>

        <h1 className="text-white text-3xl font-bold tracking-tight mb-2 text-center">
          Keynote generator
        </h1>
        <p className="text-grey-5 text-sm mb-8 text-center">
          Sign in with your GWI email to build and browse presentations.
        </p>

        {status === "sent" ? (
          <div className="bg-white/5 border border-white/10 rounded-md p-5 text-center">
            <p className="text-white text-sm">
              Check <span className="font-semibold">{email}</span> for a sign-in link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@gwi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-grey-6 outline-none focus:border-hot-pink"
            />
            {status === "error" && (
              <p className="text-error text-sm">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-hot-pink py-3 text-white font-semibold disabled:opacity-60"
            >
              {status === "sending" ? "Sending link..." : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
