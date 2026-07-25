"use client";

function cell(value) {
  if (typeof value === "string") return `"${value}"`;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Tiga keadaan yang mau kebaca sekali lihat:
 * - `incoming`: baris ini lagi push ke jalur ini (isinya belum nambah — nambahnya
 *   di langkah berikutnya, jadi ini yang bikin "mau ke mana" kelihatan lebih dulu)
 * - `grew`: isinya barusan nambah
 * - selain itu: jalur ini gak kesentuh di langkah ini
 */
function status(incoming, grew) {
  if (incoming) return { label: "lagi diisi", tone: "accent" };
  if (grew) return { label: "kemasukan", tone: "worked" };
  return { label: "diam", tone: "quiet" };
}

const TONES = {
  accent: { box: "border-accent/50 bg-accent-soft", text: "text-accent" },
  worked: { box: "border-worked/50 bg-worked-soft", text: "text-worked" },
  quiet: { box: "border-border bg-bg", text: "text-text-2" },
};

function Track({ name, label, value, prev, incoming, grew }) {
  const prevArr = Array.isArray(prev) ? prev : null;
  const state = status(incoming, grew);
  const tone = TONES[state.tone];

  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-app border px-3 py-2.5 transition-colors ${tone.box}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-1.5">
          {/* Nama variabelnya ikut ditulis biar gampang dicocokin ke kode. */}
          <code className="no-liga shrink-0 font-mono text-[12px] font-semibold text-text-1">
            {name}
          </code>
          <span className="truncate text-[10.5px] text-text-2">{label}</span>
        </span>
        <span className={`shrink-0 text-[10px] font-semibold ${tone.text}`}>
          {state.label}
        </span>
      </div>

      <div className="thin-scroll flex items-center gap-1 overflow-x-auto pb-0.5">
        {value.length === 0 && !incoming && (
          <span className="rounded-[7px] border border-dashed border-border px-2 py-1 font-mono text-[11px] text-text-2">
            masih kosong
          </span>
        )}

        {value.map((item, index) => {
          const isNew = !prevArr || index >= prevArr.length;
          return (
            <span
              key={index}
              className={`no-liga shrink-0 rounded-[7px] border px-2 py-1 font-mono text-[12px] ${
                isNew
                  ? "border-worked bg-worked font-semibold text-white"
                  : "border-border bg-surface text-text-1"
              }`}
            >
              {cell(item)}
            </span>
          );
        })}

        {/* Slot tujuan: kotak yang bakal keisi barusan diputusin di baris ini. */}
        {incoming && (
          <span className="no-liga shrink-0 rounded-[7px] border border-dashed border-accent/60 px-2 py-1 font-mono text-[12px] font-semibold text-accent">
            {incoming.value === undefined ? "+" : `+ ${cell(incoming.value)}`}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Dua (atau lebih) array tujuan yang ditaruh BERDAMPINGAN.
 *
 * Ada di panel visualisasi buat soal yang ngebagi satu sumber ke beberapa
 * tujuan: kartu variabel biasa nampilinnya berurutan ke bawah, jadi susah
 * kelihatan bahwa tiap langkah cuma SATU tujuan yang kemasukan. Di sini dua
 * jalurnya sejajar, dan yang nambah di langkah ini disorot sendiri.
 *
 * Dinyalain lewat data (`part.bandingkan`), bukan hardcode nama variabel —
 * kalau nanti ada soal serupa, tinggal isi field yang sama.
 */
export default function TrackCompare({ config, step, prevStep, access }) {
  if (!config || !step) return null;

  const calls = access?.calls ?? [];
  const reads = access?.reads ?? [];

  const tracks = config.tracks.filter((track) =>
    Array.isArray(step.vars[track.name]),
  );
  // Baru berguna kalau dua-duanya udah ada — sebelum itu kartu variabel biasa
  // udah cukup, dan bagan setengah kosong malah bikin bingung.
  if (tracks.length < 2) return null;

  return (
    <div className="rounded-app border border-border bg-surface px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="text-[10px] font-semibold tracking-wider text-text-2 uppercase">
          {config.judul}
        </h3>
        {config.keterangan && (
          <p className="text-[11px] text-text-2">{config.keterangan}</p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {tracks.map((track) => {
          const value = step.vars[track.name];
          const prev = prevStep ? prevStep.vars[track.name] : undefined;

          // Nilai yang bakal masuk dibaca dari baris yang sama (`antrian[i]`).
          // Kalau bentuknya gak sesederhana itu, slot tujuannya tetap muncul —
          // cuma isinya "+" tanpa nebak-nebak nilainya.
          const call = calls.find(
            (item) => item.name === track.name && item.adds,
          );
          const source = reads.filter(
            (read) => read.name !== track.name && read.inRange,
          );
          const incoming = call
            ? { value: source.length === 1 ? source[0].value : undefined }
            : null;

          return (
            <Track
              key={track.name}
              name={track.name}
              label={track.label ?? ""}
              value={value}
              prev={prev}
              incoming={incoming}
              grew={Array.isArray(prev) && value.length > prev.length}
            />
          );
        })}
      </div>
    </div>
  );
}
