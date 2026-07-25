"use client";

import Modal from "./Modal";

/**
 * Hint berjenjang: sekali klik = satu dorongan, bukan langsung semua.
 *
 * Hint TERAKHIR selalu berupa process flow lengkap, jadi dia ditandain beda
 * (warna + peringatan) — di titik itu siswa praktis udah dikasih jawabannya,
 * dan itu harus kerasa beda dari hint-hint sebelumnya yang masih petunjuk.
 *
 * Level-nya gak di-reset waktu popup ditutup: buka lagi = lanjut dari level
 * terakhir yang udah kebuka.
 */
export default function HintDialog({ open, onClose, hints, level, onNext }) {
  const total = hints.length;
  const shown = Math.min(Math.max(level, 1), total);
  const hint = hints[shown - 1] ?? "";
  const isLast = shown === total;
  const hasNext = shown < total;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="34rem"
      title="Hint"
      subtitle={
        isLast
          ? `Hint ${shown} dari ${total} — ini yang terakhir.`
          : `Hint ${shown} dari ${total} — coba dulu sendiri sebelum lanjut ke hint berikutnya.`
      }
      footer={
        <>
          <span className="font-mono text-[11px] text-text-2 tabular-nums">
            {shown} / {total}
          </span>
          <div className="flex items-center gap-2">
            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                className="h-9 rounded-[10px] border border-hint/40 bg-hint-soft px-4 text-sm font-semibold text-hint transition-colors hover:bg-hint/10"
              >
                Lihat hint berikutnya
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Tutup
            </button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {hints.map((_, index) => (
            <span
              key={index}
              aria-hidden
              className={`h-1.5 flex-1 rounded-full ${
                index < shown ? "bg-hint" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div
          className={`rounded-app border px-4 py-3.5 ${
            isLast
              ? "border-worked/40 bg-worked-soft"
              : "border-hint/30 bg-hint-soft"
          }`}
        >
          {isLast && (
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-worked uppercase">
              Ini sudah process flow lengkap
            </p>
          )}
          <p className="no-liga font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-text-1">
            {hint}
          </p>
        </div>

        {isLast && (
          <p className="text-[12px] leading-relaxed text-text-2">
            Kalau nyampe sini, coba tulis kodenya dari langkah-langkah di atas —
            satu langkah jadi satu baris kode.
          </p>
        )}
      </div>
    </Modal>
  );
}
