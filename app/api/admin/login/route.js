import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  checkPassword,
  createSessionValue,
  isAdminConfigured,
} from "../../../lib/adminSession";

/** Masuk: tukar password yang bener jadi cookie session httpOnly. */
export async function POST(request) {
  if (!isAdminConfigured()) {
    return Response.json(
      { error: "ADMIN_PASSWORD belum diisi di .env, jadi halaman admin masih terkunci." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body-nya bukan JSON." }, { status: 400 });
  }

  if (!checkPassword(body?.password)) {
    // Sengaja gak bedain "password salah" vs "password kosong" — gak ada yang
    // perlu tahu sejauh mana tebakannya bener.
    return Response.json({ error: "Password-nya salah." }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE.name, createSessionValue(), SESSION_COOKIE.options);

  return Response.json({ ok: true });
}

/** Keluar. */
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE.name);
  return Response.json({ ok: true });
}
