import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchGoogleDoc } from "@/lib/googleDoc";
import { generateDeck } from "@/lib/claude";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const user = userData.user;
  const email = user.email || "";
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "gwi.com";
  if (!email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { docUrl?: string; audience?: string; tone?: string; slideCount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const docUrl = body.docUrl?.trim();
  if (!docUrl) {
    return NextResponse.json({ error: "docUrl is required." }, { status: 400 });
  }

  try {
    const parsedDoc = await fetchGoogleDoc(docUrl);

    const deck = await generateDeck({
      docTitle: parsedDoc.title,
      docText: parsedDoc.text,
      images: parsedDoc.images,
      audience: body.audience,
      tone: body.tone,
      slideCountHint: body.slideCount,
    });

    const { data: inserted, error: insertErr } = await supabase
      .from("presentations")
      .insert({
        title: deck.title,
        subtitle: deck.subtitle || null,
        slides: deck.slides,
        source_doc_url: docUrl,
        created_by: user.id,
        created_by_email: email,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("Insert failed", insertErr);
      return NextResponse.json({ error: "Generated the deck but couldn't save it. Try again." }, { status: 500 });
    }

    return NextResponse.json({ id: inserted.id, deck });
  } catch (err: any) {
    console.error("Generate failed", err);
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status: 500 });
  }
}
