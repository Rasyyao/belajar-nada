import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../../lib/adminSession";
import { normalizeMateri } from "../../../../lib/materiWrite";
import { supabaseAdmin } from "../../../../lib/supabase";

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

  const { row, error } = normalizeMateri(payload);
  if (error) return Response.json({ error }, { status: 400 });

  const { data, error: writeError } = await supabaseAdmin()
    .from("materi")
    .update(row)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (writeError) {
    return Response.json({ error: writeError.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Materinya udah gak ada." }, { status: 404 });
  }

  revalidatePath("/materi");
  revalidatePath(`/materi/${id}`);
  revalidatePath("/admin/materi");

  return Response.json({ ok: true });
}

/**
 * Hapus baris materi. File yang udah terlanjur ke-upload di Storage sengaja
 * DIBIARIN — link-nya bisa aja udah kesebar ke siswa, dan biaya nyimpen file
 * kecil dibanding link yang tiba-tiba mati.
 */
export async function DELETE(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const { data, error } = await supabaseAdmin()
    .from("materi")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Materinya udah gak ada." }, { status: 404 });

  revalidatePath("/materi");
  revalidatePath("/admin/materi");

  return Response.json({ ok: true });
}
