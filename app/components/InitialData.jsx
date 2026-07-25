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
 */
export default function InitialData({ data }) {
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
            <dt className="no-liga font-mono text-[12px] font-semibold text-text-1">
              {name}
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
