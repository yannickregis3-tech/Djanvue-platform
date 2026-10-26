import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const createPostSchema = z.object({
  body: z.string().trim().max(5000).default(""),
  visibility: z.enum(["public", "followers", "private"]).default("public"),
  media_urls: z.array(z.string().url()).max(10).optional().default([]),
}).refine((value) => value.body.length > 0 || value.media_urls.length > 0, {
  message: "Une publication doit contenir du texte ou un média.",
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 20;
    const before = request.nextUrl.searchParams.get("before");
    let query = supabase.from("posts")
      .select("id, author_id, body, visibility, media_urls, media_url, media_type, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) {
      const date = new Date(before);
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Curseur de pagination invalide." }, { status: 400 });
      query = query.lt("created_at", date.toISOString());
    }
    const { data, error } = await query;
    if (error) {
      console.error("GET /api/posts:", error.message);
      return NextResponse.json({ error: "Impossible de charger les publications." }, { status: 500 });
    }
    return NextResponse.json({ posts: data ?? [], nextCursor: data?.length === limit ? data[data.length - 1]?.created_at ?? null : null });
  } catch (error) {
    console.error("GET /api/posts configuration:", error);
    return NextResponse.json({ error: "Service temporairement indisponible." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

    const input = createPostSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ error: "Données de publication invalides.", details: input.error.flatten() }, { status: 400 });

    const { data, error } = await supabase.from("posts").insert({
      author_id: user.id,
      body: input.data.body,
      visibility: input.data.visibility,
      media_urls: input.data.media_urls,
    }).select("id, author_id, body, visibility, media_urls, created_at").single();

    if (error) {
      console.error("POST /api/posts:", error.message);
      return NextResponse.json({ error: "La publication n’a pas pu être enregistrée." }, { status: 500 });
    }
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts request:", error);
    return NextResponse.json({ error: "Requête invalide ou service indisponible." }, { status: 400 });
  }
}
