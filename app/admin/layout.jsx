import Link from "next/link";
import { schemaReady } from "../lib/adminRead";
import { isAdminConfigured, isLoggedIn } from "../lib/adminSession";
import { hasServiceRole } from "../lib/supabase";
import LoginForm from "./components/LoginForm";
import LogoutButton from "./components/LogoutButton";

export const metadata = {
  title: "Admin — Playground Belajar",
};

// Layout ini baca cookie, jadi semua halaman di bawahnya otomatis dirender
// per request. Gak boleh ada versi statis dari halaman admin.
export const dynamic = "force-dynamic";

/**
 * Satu gerbang buat SEMUA halaman di bawah /admin.
 *
 * Ditaruh di layout (bukan diulang di tiap halaman) supaya halaman admin baru
 * otomatis ikut terjaga — gak ada celah gara-gara lupa nambahin cek login.
 *
 * Ini cuma nyembunyiin UI. Yang beneran nolak tulisan ke database adalah
 * `requireAdmin()` di tiap API Route, karena API-nya bisa dipanggil langsung
 * tanpa lewat halaman ini.
 */
export default async function AdminLayout({ children }) {
  if (!isAdminConfigured()) {
    return (
      <Setup title="Halaman admin belum aktif">
        Isi <code className="font-mono">ADMIN_PASSWORD</code> di file{" "}
        <code className="font-mono">.env</code>, terus jalanin ulang{" "}
        <code className="font-mono">npm run dev</code>.
      </Setup>
    );
  }

  if (!(await isLoggedIn())) return <LoginForm />;

  if (!hasServiceRole()) {
    return (
      <Setup title="Database belum nyambung">
        Password-nya udah bener, tapi{" "}
        <code className="font-mono">SUPABASE_SECRET_KEY</code> dan{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> di{" "}
        <code className="font-mono">.env</code> masih kosong — tanpa itu gak ada
        yang bisa disimpen.
      </Setup>
    );
  }

  if (!(await schemaReady())) {
    return (
      <Setup title="Tabelnya belum dibikin">
        Buka Supabase → SQL Editor, tempel isi{" "}
        <code className="font-mono">supabase/schema.sql</code>, jalanin. Habis
        itu <code className="font-mono">node scripts/seed.mjs</code> buat
        mindahin soal yang udah ada ke database.
      </Setup>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-4">
        <Link href="/admin" className="font-heading text-xl text-text-1">
          Admin
        </Link>
        <nav className="flex items-center gap-1">
          <AdminLink href="/admin">Soal</AdminLink>
          <AdminLink href="/admin/materi">Materi</AdminLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/mini-project"
            className="flex h-9 items-center rounded-[10px] border border-border bg-surface px-3 text-[13px] font-semibold text-text-1 transition-colors hover:bg-bg"
          >
            Lihat sisi siswa →
          </Link>
          <LogoutButton />
        </div>
      </header>

      {children}
    </div>
  );
}

function AdminLink({ href, children }) {
  return (
    <Link
      href={href}
      className="rounded-[10px] px-3 py-1.5 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface hover:text-text-1"
    >
      {children}
    </Link>
  );
}

/** Layar "belum disiapin" — bukan error, tapi instruksi apa yang kurang. */
function Setup({ title, children }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <div className="rounded-app border border-border bg-surface p-6">
        <h1 className="font-heading text-xl text-text-1">{title}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-text-2">{children}</p>
      </div>
    </div>
  );
}
