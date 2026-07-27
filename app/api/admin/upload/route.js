import { requireAdmin } from "../../../lib/adminSession";
import { MATERI_BUCKET, supabaseAdmin } from "../../../lib/supabase";

/**
 * Upload file materi ke Supabase Storage.
 *
 * Sengaja lewat server (service role) bukan langsung dari browser pakai anon
 * key: dengan begini bucket-nya gak perlu dikasih policy tulis buat publik.
 * Satu-satunya jalan masuk file adalah route ini, yang udah dijaga password admin.
 */

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB — cukup buat PDF materi, jauh dari limit free tier

/** Nama file dibersihin: spasi & karakter aneh bikin URL publiknya susah dibaca. */
function safeName(name) {
  const cleaned = (name || "file")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return cleaned || "file";
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Kirimnya harus multipart/form-data." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "Gak ada file yang dikirim." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "File-nya kosong." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File kegedean — maksimal ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  // Prefix waktu bikin nama file gak pernah tabrakan, jadi upload file dengan
  // nama sama dua kali tetap ngasilin dua URL yang beda.
  const path = `${Date.now()}-${safeName(file.name)}`;

  const supabase = supabaseAdmin();
  const { error } = await supabase.storage
    .from(MATERI_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(MATERI_BUCKET).getPublicUrl(path);

  return Response.json({ ok: true, url: data.publicUrl, path });
}
