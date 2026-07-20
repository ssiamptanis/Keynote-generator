"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLogoUrl } from "@/components/DesignSystemProvider";

export default function TopNav({ email }: { email?: string }) {
  const router = useRouter();
  const logoUrl = useLogoUrl("on-white");

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-grey-3 bg-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/library" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="GWI" width={56} height={17} />
            <span className="font-bold text-off-black text-sm">Keynote generator</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-semibold text-grey-7">
            <Link href="/library" className="hover:text-off-black">
              Library
            </Link>
            <Link href="/generate" className="hover:text-off-black">
              New presentation
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-grey-6">{email}</span>}
          <button onClick={signOut} className="text-sm font-semibold text-grey-7 hover:text-off-black">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
