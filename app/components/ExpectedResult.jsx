"use client";

function format(value) {
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value);
}

/**
 * Target hasil akhir, ditempel langsung di bawah daftar input.
 *
 * Ditaruh sebelahan sama input-nya (bukan di panel lain) supaya kebacanya jadi
 * satu kalimat: "dikasih jawaban ini → hasil akhirnya harus jadi ini". Selalu
 * kelihatan dari awal, gak nunggu kodenya dijalankan dulu.
 */
export default function ExpectedResult({ expected, edited, onResetInputs }) {
  const entries = Object.entries(expected ?? {});
  if (entries.length === 0) return null;

  return (
    <div className="border-t border-border">
      <div className="flex items-baseline gap-2 bg-bg px-4 py-2">
        <span aria-hidden className="text-text-2">
          ↓
        </span>
        <h3 className="text-[10px] font-semibold tracking-wider text-text-2 uppercase">
          Hasil akhirnya harus jadi
        </h3>
      </div>

      <dl className="divide-y divide-border/70">
        {entries.map(([name, value]) => (
          <div key={name} className="px-4 py-2">
            <dt className="no-liga font-mono text-[12px] font-semibold text-text-1">
              {name}
            </dt>
            <dd className="no-liga mt-0.5 font-mono text-[12.5px] break-all text-success">
              {format(value)}
            </dd>
          </div>
        ))}
      </dl>

      {edited && (
        <p className="border-t border-border bg-worked-soft px-4 py-2 text-[11px] leading-relaxed text-text-1">
          Input di atas sudah diubah dari contoh bawaan, jadi hasilnya wajar
          kalau beda dari target ini.{" "}
          <button
            type="button"
            onClick={onResetInputs}
            className="font-semibold text-worked underline decoration-worked/40 underline-offset-2"
          >
            Balikin ke bawaan
          </button>
        </p>
      )}
    </div>
  );
}
