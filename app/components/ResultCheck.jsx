"use client";

function format(value) {
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
}

function compare(expected, lastStep) {
  return Object.entries(expected ?? {}).map(([name, want]) => {
    const got = lastStep.vars[name];
    return { name, want, got, match: format(want) === format(got) };
  });
}

/**
 * Apakah hasil akhir satu run sudah cocok semua? Dipakai di luar komponen ini
 * buat nandain part yang udah beres di tab — pakai perbandingan yang sama persis
 * dengan tabel di bawah, biar gak ada kasus "tabelnya hijau tapi tabnya belum".
 */
export function matchesExpected(expected, lastStep) {
  if (!lastStep) return false;
  const rows = compare(expected, lastStep);
  return rows.length > 0 && rows.every((row) => row.match);
}

/**
 * Konfeti seadanya: beberapa kepingan kecil yang jatuh sekali terus ilang.
 *
 * Digambar pakai div biasa dan `pointer-events-none` — gak nambah library, gak
 * ngalangin klik apa pun di bawahnya. Sengaja cuma 9 keping dan kelar dalam
 * di bawah 1 detik: ini tepuk tangan sebentar, bukan pertunjukan.
 */
const CONFETTI = [
  { left: "8%", delay: "0ms", color: "bg-success" },
  { left: "18%", delay: "90ms", color: "bg-accent" },
  { left: "29%", delay: "40ms", color: "bg-worked" },
  { left: "41%", delay: "150ms", color: "bg-success" },
  { left: "53%", delay: "20ms", color: "bg-hint" },
  { left: "64%", delay: "120ms", color: "bg-accent" },
  { left: "75%", delay: "70ms", color: "bg-worked" },
  { left: "85%", delay: "170ms", color: "bg-success" },
  { left: "93%", delay: "50ms", color: "bg-hint" },
];

function Confetti() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible"
    >
      {CONFETTI.map((piece) => (
        <span
          key={piece.left}
          style={{ left: piece.left, animationDelay: piece.delay }}
          className={`anim-confetti absolute top-0 size-1.5 rounded-[2px] ${piece.color}`}
        />
      ))}
    </div>
  );
}

/**
 * Bandingin nilai akhir variabel dengan hasil yang sudah divalidasi di data.
 * Ini alat bantu ngajar buat jawab "kodeku udah bener belum?" — bukan penilai
 * otomatis, jadi nilai yang diharapkan sengaja ditampilin apa adanya.
 */
export default function ResultCheck({ expected, lastStep }) {
  if (!lastStep) return null;

  const rows = compare(expected, lastStep);
  if (rows.length === 0) return null;

  const allMatch = rows.every((row) => row.match);

  return (
    <div
      className={`relative rounded-app border px-4 py-3 ${
        allMatch ? "border-success/40 bg-success-soft" : "border-border bg-surface"
      }`}
    >
      {/* Animasi cuma main pas komponennya baru muncul — dan komponen ini
          kerender ulang tiap kali kode dijalanin, jadi hadiahnya keluar sekali
          per run yang berhasil, bukan tiap kali langkahnya digeser. */}
      {allMatch && <Confetti />}

      <div className="mb-2.5 flex items-baseline gap-2">
        <h3 className="font-heading text-base text-text-1">Cek hasil akhir</h3>
        {allMatch ? (
          <span className="anim-badge-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-white">
            ✓ Cocok!
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-text-2">
            belum cocok semua
          </span>
        )}
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
