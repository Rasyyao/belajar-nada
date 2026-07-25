"use client";

function format(value) {
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value);
}

/**
 * Data awal yang udah ketulis di kode.
 *
 * Soal berpart gak minta input lewat `ambilInput()` — nilai awalnya ditulis
 * langsung di baris `var ... = ...` paling bawah. Panel ini nyorot nilai itu
 * biar tetap kebaca "dikasih ini → hasilnya harus jadi ini", sama kayak pasangan
 * Input + Target di mini project yang interaktif.
 *
 * `origins` (opsional) nandain data yang sebenernya OPERAN dari part sebelumnya,
 * biar rantai "hasil part 1 → bahan part 2" kebaca, bukan keliatan angka baru
 * yang muncul entah dari mana.
 */
export default function InitialData({ data, origins = {} }) {
  const entries = Object.entries(data ?? {});
  if (entries.length === 0) return null;

  return (
    <div>
      <div className="bg-bg px-4 py-2">
        <h3 className="text-[10px] font-semibold tracking-wider text-text-2 uppercase">
          Data awal di kode
        </h3>
      </div>

      <dl className="divide-y divide-border/70">
        {entries.map(([name, value]) => (
          <div key={name} className="px-4 py-2">
            <dt className="flex flex-wrap items-center gap-1.5">
              <span className="no-liga font-mono text-[12px] font-semibold text-text-1">
                {name}
              </span>
              {origins[name] && (
                <span className="rounded-full border border-worked/30 bg-worked-soft px-1.5 py-px text-[10px] font-semibold text-worked">
                  ← hasil Part {origins[name]}
                </span>
              )}
            </dt>
            <dd className="no-liga mt-0.5 font-mono text-[12.5px] break-all text-text-2">
              {format(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
