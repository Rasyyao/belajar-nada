"use client";

function format(value) {
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
}

/**
 * Bandingin nilai akhir variabel dengan hasil yang sudah divalidasi di data.
 * Ini alat bantu ngajar buat jawab "kodeku udah bener belum?" — bukan penilai
 * otomatis, jadi nilai yang diharapkan sengaja ditampilin apa adanya.
 */
export default function ResultCheck({ expected, lastStep }) {
  const entries = Object.entries(expected ?? {});
  if (entries.length === 0 || !lastStep) return null;

  const rows = entries.map(([name, want]) => {
    const got = lastStep.vars[name];
    return { name, want, got, match: format(want) === format(got) };
  });

  const allMatch = rows.every((row) => row.match);

  return (
    <div
      className={`rounded-app border px-4 py-3 ${
        allMatch ? "border-success/40 bg-success-soft" : "border-border bg-surface"
      }`}
    >
      <div className="mb-2.5 flex items-baseline gap-2">
        <h3 className="font-heading text-base text-text-1">Cek hasil akhir</h3>
        <span
          className={`text-[11px] font-semibold ${
            allMatch ? "text-success" : "text-text-2"
          }`}
        >
          {allMatch ? "semua cocok" : "belum cocok semua"}
        </span>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] tracking-wider text-text-2 uppercase">
            <th className="pb-1 font-semibold">Variabel</th>
            <th className="pb-1 font-semibold">Punyamu</th>
            <th className="pb-1 font-semibold">Seharusnya</th>
          </tr>
        </thead>
        <tbody className="no-liga align-top font-mono text-[12.5px]">
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-border/70">
              <td className="py-1.5 pr-3 font-semibold text-text-1">
                {row.name}
              </td>
              {/* break-all: nilai array panjang harus turun baris, jangan maksa
                  panelnya di-scroll ke samping pas lagi dipandangin bareng siswa. */}
              <td
                className={`py-1.5 pr-3 break-all ${
                  row.match ? "text-success" : "text-error"
                }`}
              >
                {row.match ? "✓ " : "✗ "}
                {format(row.got)}
              </td>
              <td className="py-1.5 break-all text-text-2">
                {format(row.want)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
