"use client";

function Slot({ name, caption, tone }) {
  const tones = {
    accent: "border-accent/40 bg-accent-soft text-accent",
    worked: "border-worked/40 bg-worked-soft text-worked",
  };
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-semibold tracking-wider text-text-2 uppercase">
        {caption}
      </p>
      <code
        className={`no-liga block w-fit max-w-full rounded-md border px-2 py-1 font-mono text-[12px] font-semibold break-all ${tones[tone]}`}
      >
        {name}
      </code>
    </div>
  );
}

function Connector({ label, tone }) {
  const color = tone === "accent" ? "text-accent" : "text-worked";

  return (
    <div className={`flex min-w-10 flex-col items-center gap-0.5 ${color}`}>
      <span aria-hidden className="text-lg leading-none">
        →
      </span>
      <span className="text-center text-[9px] leading-tight text-text-2">
        {label}
      </span>
    </div>
  );
}

/**
 * Diagram parameter vs return.
 *
 * Konsep yang paling sering bikin bingung: "nilai dari luar masuk lewat mana, dan
 * hasil di dalam keluarnya lewat mana". Digambar sebagai dua pintu — masuk lewat
 * parameter (biru), keluar lewat return (ungu) — pakai nama variabel project ini
 * sendiri, bukan contoh generik. Setiap konektor menyebutkan asal dan tujuan
 * supaya nama parameter yang kebetulan sama gak terlihat seperti data baru.
 *
 * `alur.keluar` boleh `null`: itu buat function yang SENGAJA gak punya return,
 * yang hasilnya nempel langsung ke array yang dioper sebagai parameter. Kasus itu
 * dikasih penjelasannya sendiri lewat `alur.catatanKeluar`, bukan dikosongin —
 * "gak ada pintu keluar" justru pelajarannya di situ.
 */
export default function ParamReturnDiagram({ alur }) {
  if (!alur) return null;

  return (
    <div className="overflow-hidden rounded-app border border-border">
      <div className="border-b border-border bg-accent-soft/35 px-3 py-2">
        <p className="text-[10px] leading-relaxed text-text-2">
          Baca dari kiri ke kanan: data luar dikirim ke parameter, diproses,
          lalu hasilnya keluar.
        </p>
        <p className="mt-1 no-liga font-mono text-[11px] text-text-1">
          function {alur.namaFunction}(
          {alur.masuk.map((pair) => pair.dalam).join(", ")})
        </p>
      </div>

      <div className="border-b border-border px-3 py-2.5">
        <p className="mb-2 text-[10px] font-semibold tracking-wider text-accent uppercase">
          1 · Data masuk ke function
        </p>
        <div className="flex flex-col gap-2.5">
          {alur.masuk.map((pair) => (
            <div
              key={`${pair.luar}-${pair.dalam}`}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5"
            >
              <Slot name={pair.luar} caption="dari luar" tone="accent" />
              <Connector label="argumen dikirim" tone="accent" />
              <Slot
                name={pair.dalam}
                caption="parameter function"
                tone="accent"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-border bg-bg/60 px-3 py-2.5">
        <h3 className="text-[10px] font-semibold tracking-wider text-text-2 uppercase">
          2 · Diproses di dalam function
        </h3>
        <p className="text-[12px] leading-relaxed text-text-1">{alur.proses}</p>
      </div>

      <div className="px-3 py-2.5">
        {alur.keluar ? (
          <>
            <p className="mb-2 text-[10px] font-semibold tracking-wider text-worked uppercase">
              3 · Hasil keluar dari function
            </p>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
              <Slot
                name={`return ${alur.keluar.dalam}`}
                caption="return dari function"
                tone="worked"
              />
              <Connector label="hasil dikirim" tone="worked" />
              <Slot
                name={alur.keluar.luar}
                caption="diterima di luar"
                tone="worked"
              />
            </div>
          </>
        ) : (
          <>
            <p className="mb-2 text-[10px] font-semibold tracking-wider text-worked uppercase">
              3 · Hasil keluar tanpa return
            </p>
            <div className="rounded-md border border-dashed border-worked/50 bg-worked-soft px-2.5 py-2">
              <p className="font-mono text-[12px] font-semibold text-worked">
                tidak ada return
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-1">
                Array tujuan berubah langsung karena function menerima benda
                yang sama (by reference).
              </p>
            </div>
            {alur.catatanKeluar && (
              <p className="mt-2 text-[11px] leading-relaxed text-text-2">
                {alur.catatanKeluar}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
