"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Gerbang password halaman admin.
 *
 * Password-nya dikirim ke API Route buat dicocokin — gak pernah dibandingin di
 * browser, karena kalau gitu password-nya harus ikut ke bundle JavaScript.
 * Sesudah cocok, `router.refresh()` bikin layout server ngerender ulang dan
 * ngeliat cookie session yang baru ke-set.
 */
export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? "Gagal masuk.");
        setPassword("");
        return;
      }

      router.refresh();
    } catch {
      setError("Gak bisa nyambung ke server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-app border border-border bg-surface p-6"
      >
        <div>
          <h1 className="font-heading text-2xl text-text-1">Halaman Admin</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
            Buat nambah dan ngedit soal. Masukin password admin dulu.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="h-10 rounded-[10px] border border-border bg-bg px-3 text-sm text-text-1 outline-none focus:border-accent"
          />
        </label>

        {error && (
          <p className="rounded-app border border-error/40 bg-error-soft px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="h-10 rounded-[10px] bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {busy ? "Ngecek…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
