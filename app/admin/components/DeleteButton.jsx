"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Tombol hapus dengan konfirmasi dua langkah (klik → "Yakin?" → klik lagi).
 *
 * Sengaja BUKAN `window.confirm()`: dialog bawaan browser ngeblok semua event,
 * dan di sesi ngajar yang di-share layar, popup modal browser sering kepotong.
 */
export default function DeleteButton({ url, label = "Hapus", onDeleted }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    if (!armed) {
      setArmed(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Gagal hapus.");
        setArmed(false);
        return;
      }
      if (onDeleted) onDeleted();
      router.refresh();
    } catch {
      setError("Gak bisa nyambung ke server.");
      setArmed(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      {armed && !busy && (
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="text-[12px] font-semibold text-text-2 hover:text-text-1"
        >
          Batal
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className={`h-9 rounded-[10px] border px-3 text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
          armed
            ? "border-error bg-error text-white"
            : "border-border bg-surface text-text-2 hover:border-error/40 hover:bg-error-soft hover:text-error"
        }`}
      >
        {busy ? "Menghapus…" : armed ? "Yakin hapus?" : label}
      </button>
      {error && <span className="text-[12px] text-error">{error}</span>}
    </span>
  );
}
