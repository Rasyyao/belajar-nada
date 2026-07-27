import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../../lib/adminSession";
import { normalizeCasePayload, writeCase } from "../../../../lib/caseWrite";
import { supabaseAdmin } from "../../../../lib/supabase";

/** Update case + semua part-nya. Part lama dibuang, diganti isi form. */
export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body-nya bukan JSON." }, { status: 400 });
  }

  const { caseRow, partRows, error } = normalizeCasePayload(payload);
  if (error) return Response.json({ error }, { status: 400 });

  const result = await writeCase({ id, caseRow, partRows });
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  revalidatePath("/mini-project");
  revalidatePath(`/mini-project/${result.data.slug}`);
  revalidatePath("/admin");

  return Response.json({ ok: true, slug: result.data.slug });
}

/** Hapus case. Part-nya ikut kehapus lewat `on delete cascade` di skema. */
export async function DELETE(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const { data, error } = await supabaseAdmin()
    .from("cases")
    .delete()
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Soalnya udah gak ada." }, { status: 404 });

  revalidatePath("/mini-project");
  revalidatePath(`/mini-project/${data.slug}`);
  revalidatePath("/admin");

  return Response.json({ ok: true });
}
