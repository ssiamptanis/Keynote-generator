import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: presentations, error } = await supabase
    .from("presentations")
    .select("id, title, subtitle, created_by_email, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-grey-1">
      <TopNav email={userData.user?.email} />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-off-black tracking-tight">Presentation library</h1>
            <p className="text-grey-7 mt-2">Every keynote generated across GWI, saved for anyone to reopen.</p>
          </div>
          <Link href="/generate" className="rounded-md bg-hot-pink px-6 py-3 text-white font-semibold">
            New presentation
          </Link>
        </div>

        {error && <p className="text-error">Couldn&apos;t load presentations: {error.message}</p>}

        {presentations && presentations.length === 0 && (
          <div className="border border-dashed border-grey-4 rounded-card p-16 text-center">
            <p className="text-grey-7 mb-6">No presentations yet — be the first to generate one.</p>
            <Link href="/generate" className="rounded-md bg-hot-pink px-6 py-3 text-white font-semibold">
              New presentation
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {presentations?.map((p) => (
            <Link
              key={p.id}
              href={`/deck/${p.id}`}
              className="block rounded-card border border-grey-3 bg-white p-6 hover:border-hot-pink transition-colors"
            >
              <div className="w-full aspect-video rounded-md bg-off-black mb-4 flex items-center justify-center">
                <span className="text-hot-pink font-bold text-2xl">GWI</span>
              </div>
              <h3 className="font-bold text-off-black text-lg leading-snug mb-1">{p.title}</h3>
              {p.subtitle && <p className="text-grey-6 text-sm mb-3 line-clamp-2">{p.subtitle}</p>}
              <p className="text-grey-6 text-xs">
                {p.created_by_email} &middot; {new Date(p.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
