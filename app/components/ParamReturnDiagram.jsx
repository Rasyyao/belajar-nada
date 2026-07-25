"use client";

function Slot({ name, where, tone }) {
  const tones = {
    accent: "border-accent/40 bg-accent-soft text-accent",
    worked: "border-worked/40 bg-worked-soft text-worked",
  };
  return (
    <div className="flex items-baseline justify-between gap-2">
      <code
        className={`no-liga rounded-[7px] border px-2 py-1 font-mono text-[12px] font-semibold ${tones[tone]}`}
      >
        {name}
      </code>
      <span className="shrink-0 text-[10px] text-text-2">{where}</span>
    </div>
  );
}

function Arrow({ label, tone }) {
  return (
    <div className="flex items-center gap-2 py-1.5 pl-1">
      <span
        aria-hidden
        className={tone === "accent" ? "text-accent" : "text-worked"}
      >
        ↓
      </span>
      <span className="text-[10.5px] text-text-2">{label}</span>
    </div>
  );
}

/**
 * Diagram parameter vs return.
 *
 * Konsep yang paling sering bikin bingung: "nilai dari luar masuk lewat mana, dan
 * hasil di dalam keluarnya lewat mana". Digambar sebagai dua pintu — masuk lewat
 * parameter (biru), keluar lewat return (ungu) — pakai nama variabel project ini
 * sendiri, bukan contoh generik.
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
      <div className="border-b border-border bg-bg px-3 py-2">
        <h3 className="text-[10px] font-semibold tracking-wider text-text-2 uppercase">
          Jalur data: parameter &amp; return
        </h3>
        <p className="mt-0.5 no-liga font-mono text-[11px] text-text-2">
          function {alur.namaFunction}()
        </p>
      </div>

      <div className="border-b border-border px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-accent uppercase">
          Parameter = pintu masuk
        </p>
        {alur.masuk.map((pair) => (
          <div key={pair.luar} className="mb-1 last:mb-0">
            <Slot name={pair.luar} where="di luar (global)" tone="accent" />
            <Arrow label="masuk lewat parameter" tone="accent" />
            <Slot name={pair.dalam} where="di dalam function" tone="accent" />
          </div>
        ))}
      </div>

      <div className="border-b border-border bg-bg/60 px-3 py-2">
        <p className="mb-1 text-[10px] font-semibold tracking-wider text-text-2 uppercase">
          Dikerjain di dalam
        </p>
        <p className="text-[12px] leading-relaxed text-text-1">{alur.proses}</p>
      </div>

      <div className="px-3 py-2.5">
        {alur.keluar ? (
          <>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-worked uppercase">
              Return = pintu keluar
            </p>
            <Slot
              name={`return ${alur.keluar.dalam}`}
              where="di dalam function"
              tone="worked"
            />
            <Arrow label="ditangkep di luar pakai var ... =" tone="worked" />
            <Slot
              name={alur.keluar.luar}
              where="di luar (global)"
              tone="worked"
            />
          </>
        ) : (
          <>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-worked uppercase">
              Tanpa return — sengaja
            </p>
            <div className="flex items-center gap-2">
              <code className="no-liga rounded-[7px] border border-dashed border-worked/50 bg-worked-soft px-2 py-1 font-mono text-[12px] font-semibold text-worked">
                (gak ada return)
              </code>
              <span className="text-[10px] text-text-2">
                pintu keluarnya ditutup
              </span>
            </div>
            {alur.catatanKeluar && (
              <p className="mt-2 text-[12px] leading-relaxed text-text-1">
                {alur.catatanKeluar}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
