"use client";

/** Kotak error yang tetap ngasih jalan keluar, bukan cuma bilang "gagal". */
export default function ErrorBox({ error, stepCount = 0, onFixLetConst }) {
  if (!error) return null;

  return (
    <div className="rounded-r-app border-l-4 border-error bg-error-soft px-4 py-3 text-sm">
      <p className="font-mono font-semibold text-error">
        {error.title}
        {error.line ? ` · sekitar baris ${error.line}` : ""}
      </p>
      <p className="mt-1 leading-relaxed text-text-1">{error.message}</p>
      {error.raw && (
        <p className="mt-1 font-mono text-xs text-text-2">{error.raw}</p>
      )}
      {error.canFixLetConst && onFixLetConst && (
        <button
          type="button"
          onClick={onFixLetConst}
          className="mt-2.5 rounded-[10px] border border-error bg-surface px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error-soft"
        >
          Ubah let/const jadi var
        </button>
      )}
      {stepCount > 0 && (
        <p className="mt-2 text-xs text-text-2">
          {stepCount} langkah sebelum error tetap bisa ditelusuri.
        </p>
      )}
    </div>
  );
}
