import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/adminSession";
import { normalizeMateri } from "../../../lib/materiWrite";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
    .insert(row)
    .select("id")
    .single();

  if (writeError) {
    return Response.json({ error: writeError.message }, { status: 500 });
  }

  revalidatePath("/materi");
  revalidatePath("/admin/materi");

  return Response.json({ ok: true, id: data.id }, { status: 201 });
}
