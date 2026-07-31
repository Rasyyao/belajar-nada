import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/adminSession";
import { normalizeCasePayload, writeCase } from "../../../lib/caseWrite";

/** Bikin soal baru — case + semua part-nya sekaligus dalam satu request. */
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body-nya bukan JSON." }, { status: 400 });
  }

  const { caseRow, partRows, error } = normalizeCasePayload(payload);
  if (error) return Response.json({ error }, { status: 400 });

  const result = await writeCase({
    caseRow,
    partRows,
    upsert: payload?.importMode === "upsert",
  });
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  revalidatePath("/mini-project");
  revalidatePath(`/mini-project/${result.data.slug}`);
  revalidatePath("/admin");

  return Response.json({ ok: true, id: result.data.id, slug: result.data.slug }, { status: 201 });
}
