import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SlideViewer from "@/components/SlideViewer";
import type { Deck } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: presentation, error } = await supabase
    .from("presentations")
    .select("id, title, subtitle, slides, source_doc_url, created_by_email, created_at")
    .eq("id", params.id)
    .single();

  if (error || !presentation) {
    notFound();
  }

  const deck: Deck = {
    title: presentation.title,
    subtitle: presentation.subtitle || undefined,
    slides: presentation.slides,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="no-print border-b border-grey-3 px-6 py-3 flex items-center justify-between">
        <Link href="/library" className="text-sm font-semibold text-grey-7 hover:text-off-black">
          Back to library
        </Link>
        <div className="text-sm text-grey-6">
          {presentation.created_by_email} &middot;{" "}
          {new Date(presentation.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <SlideViewer deck={deck} />
      </div>
    </div>
  );
}
