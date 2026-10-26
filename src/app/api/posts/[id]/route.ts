import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const updatePostSchema = z.object({
  body: z.string().trim().max(5000).optional(),
  visibility: z.enum(["public", "followers", "private"]).optional(),
}).refine((value) => value.body !== undefined || value.visibility !== undefined, {
  message: "Aucune modification fournie.",
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const { id } = await context.params;
    const input = updatePostSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) {
      return NextResponse.json({ error: "Données de modification invalides.", details: input.error.flatten() }, { status: 400 });
    }

    const updates = { ...input.data, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .eq("author_id", user.id)
      .select("id, author_id, body, visibility, media_urls, media_url, media_type, created_at, updated_at")
      .maybeSingle();

    if (error) {
      console.error("PATCH /api/posts/[id]:", error.message);
      return NextResponse.json({ error: "La publication n’a pas pu être modifiée." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Publication introuvable ou modification non autorisée." }, { status: 404 });
    }
    return NextResponse.json({ post: data });
  } catch (error) {
    console.error("PATCH /api/posts/[id] request:", error);
    return NextResponse.json({ error: "Requête invalide ou service indisponible." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const { id } = await context.params;
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("DELETE /api/posts/[id]:", error.message);
      return NextResponse.json({ error: "La publication n’a pas pu être supprimée." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Publication introuvable ou suppression non autorisée." }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("DELETE /api/posts/[id] request:", error);
    return NextResponse.json({ error: "Service temporairement indisponible." }, { status: 503 });
  }
}
