"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Field, Label, TextArea } from "./Fields";

/**
 * Form tambah/edit materi.
 *
 * File-nya di-upload duluan ke `/api/admin/upload` (bukan pas Simpan), supaya
 * URL publiknya udah kepegang dan kelihatan di form sebelum barisnya disimpen —
 * kalau nanti nyimpennya gagal, file-nya gak ikut ilang.
 */
export default function MateriForm({ initial }) {
  const router = useRouter();
  const fileInput = useRef(null);

  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [kategori, setKategori] = useState(initial?.kategori ?? "");
  const [konten, setKonten] = useState(initial?.konten ?? "");
  const [fileUrl, setFileUrl] = useState(initial?.file_url ?? "");
  const [urutan, setUrutan] = useState(initial?.urutan ?? 0);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(initial?.id);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Gagal upload file.");
        return;
      }
      setFileUrl(json.url);
    } catch {
      setError("Gak bisa nyambung ke server pas upload.");
    } finally {
      setUploading(false);
      // Direset biar file yang sama bisa dipilih lagi kalau upload-nya gagal.
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        isEdit ? `/api/admin/materi/${initial.id}` : "/api/admin/materi",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ judul, kategori, konten, fileUrl, urutan }),
        },
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Gagal nyimpen.");
        return;
      }

      router.push("/admin/materi");
      router.refresh();
    } catch {
      setError("Gak bisa nyambung ke server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-10">
      <section className="flex flex-col gap-4 rounded-app border border-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
          <Field label="Judul" value={judul} onChange={setJudul} required />
          <Field
            label="Kategori"
            hint="jadi pengelompokan di halaman siswa"
            value={kategori}
            onChange={setKategori}
            placeholder="Array"
          />
          <Field
            label="Urutan"
            hint="kecil = duluan"
            type="number"
            value={urutan}
            onChange={setUrutan}
          />
        </div>

        <TextArea
          label="Konten"
          hint="markdown — ## judul, - daftar, **tebal**, `kode`"
          value={konten}
          onChange={setKonten}
          rows={16}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-app border border-border bg-surface p-5">
        <Label hint="opsional — PDF, gambar, apa aja">File materi</Label>

        {fileUrl ? (
          <div className="flex flex-wrap items-center gap-3 rounded-app border border-border bg-bg px-3 py-2.5">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="no-liga min-w-0 flex-1 truncate font-mono text-[12px] text-accent underline underline-offset-2"
            >
              {fileUrl}
            </a>
            <button
              type="button"
              onClick={() => setFileUrl("")}
              className="h-8 shrink-0 rounded-[10px] border border-border px-3 text-[12px] font-semibold text-text-2 transition-colors hover:border-error/40 hover:bg-error-soft hover:text-error"
            >
              Lepas file
            </button>
          </div>
        ) : (
          <p className="text-[12.5px] text-text-2">Belum ada file.</p>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="text-[12.5px] text-text-2 file:mr-3 file:h-9 file:cursor-pointer file:rounded-[10px] file:border file:border-border file:bg-surface file:px-3 file:text-[12.5px] file:font-semibold file:text-text-1"
          />
          {uploading && <span className="text-[12.5px] text-text-2">Meng-upload…</span>}
        </div>

        <p className="text-[11.5px] text-text-2">
          File masuk ke bucket <code className="font-mono">materi-files</code> dan
          bisa dibuka siapa aja yang punya link-nya.
        </p>
      </section>

      {error && (
        <p className="rounded-app border border-error/40 bg-error-soft px-4 py-3 text-[13px] text-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="h-10 rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {saving ? "Nyimpen…" : isEdit ? "Simpan perubahan" : "Simpan materi"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/materi")}
          className="h-10 rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
