import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Gerbang password buat halaman admin.
 *
 * SENGAJA sederhana: ini tools internal yang dipakai satu orang, jadi belum
 * perlu sistem auth penuh (user, hash password, reset, dst). Yang dijaga di
 * sini cuma satu hal — tombol tulis ke database gak boleh kepencet orang lain.
 *
 * Cookie-nya ditandatangani HMAC pakai ADMIN_PASSWORD sebagai kunci, jadi
 * isinya gak bisa dipalsuin tanpa tahu password-nya. Password-nya sendiri gak
 * pernah ikut ke cookie.
 *
 * Kalau nanti pengajarnya lebih dari satu, ganti file ini sama auth beneran —
 * pemanggilnya cuma butuh `requireAdmin()` tetap ada.
 */

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // seminggu

function secret() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD belum diisi di .env — halaman admin dimatikan.");
  }
  return password;
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(issuedAt) {
  return createHmac("sha256", secret()).update(`admin:${issuedAt}`).digest("hex");
}

/** Bandingin dua string tanpa bocorin panjang kecocokannya lewat waktu eksekusi. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(input) {
  if (!isAdminConfigured()) return false;
  return safeEqual(input ?? "", process.env.ADMIN_PASSWORD);
}

/** Nilai cookie: waktu terbit + tanda tangannya, dipisah titik. */
export function createSessionValue() {
  const issuedAt = Date.now();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifySessionValue(value) {
  if (!value || !isAdminConfigured()) return false;

  const dot = value.indexOf(".");
  if (dot < 0) return false;

  const issuedAt = Number(value.slice(0, dot));
  const signature = value.slice(dot + 1);
  if (!Number.isFinite(issuedAt)) return false;

  // Kedaluwarsa dicek di server juga, bukan cuma ngandelin maxAge cookie —
  // browser bisa aja ngirim balik cookie yang harusnya udah lewat umurnya.
  if (Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) return false;

  return safeEqual(signature, sign(issuedAt));
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  options: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    // Di localhost (http) cookie `secure` gak akan pernah kesimpen, jadi flag-nya
    // cuma dinyalain pas produksi.
    secure: process.env.NODE_ENV === "production",
  },
};

/** Dipakai halaman admin (Server Component) buat mutusin nampilin form login atau isinya. */
export async function isLoggedIn() {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE_NAME)?.value);
}

/**
 * Penjaga buat API Route. Balikin `Response` 401 kalau belum login, atau `null`
 * kalau boleh lanjut — jadi call site-nya tinggal:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin() {
  if (await isLoggedIn()) return null;
  return Response.json(
    { error: "Belum login sebagai admin." },
    { status: 401 },
  );
}
