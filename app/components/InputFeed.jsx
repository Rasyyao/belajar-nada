"use client";

/**
 * Daftar jawaban yang bakal "disuapin" ke program lewat `ambilInput()`.
 *
 * Sandbox interpreter gak bisa nyentuh prompt browser, jadi semua jawaban
 * disiapkan di sini dulu. Pas langkahnya dijalanin, baris yang sudah kepakai
 * ditandai — jadi kelihatan program lagi ada di pertanyaan yang mana.
 */
export default function InputFeed({
  inputs,
  labels = [],
  consumed = null,
  onChange,
  onReset,
  isDefault,
  needsInput = true,
}) {
  const setValue = (index, value) =>
    onChange(inputs.map((item, i) => (i === index ? value : item)));

  const removeAt = (index) =>
    onChange(inputs.filter((_, i) => i !== index));

  const addRow = () => onChange([...inputs, ""]);

  return (
    <div className="flex flex-col gap-2 p-4">
      <ol className="flex flex-col gap-2">
        {inputs.map((value, index) => {
          const done = consumed !== null && index < consumed;
          const asking = consumed !== null && index === consumed;

          return (
            <li key={index} className="flex flex-col gap-1">
              <label className="flex items-baseline gap-2 text-[11px]">
                <span
                  className={`font-mono tabular-nums ${
                    asking ? "font-semibold text-accent" : "text-text-2"
                  }`}
                >
                  {index + 1}.
                </span>
                <span
                  className={
                    asking
                      ? "font-medium text-accent"
                      : done
                        ? "text-text-2 line-through decoration-border"
                        : "text-text-2"
                  }
                >
                  {labels[index] ?? `Input ke-${index + 1}`}
                </span>
                {asking && (
                  <span className="ml-auto shrink-0 font-medium text-accent">
                    lagi ditanya
                  </span>
                )}
                {done && (
                  <span className="ml-auto shrink-0 text-success">terjawab</span>
                )}
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  value={value}
                  onChange={(event) => setValue(index, event.target.value)}
                  spellCheck={false}
                  className={`no-liga h-9 min-w-0 flex-1 rounded-[10px] border bg-surface px-3 font-mono text-[13px] text-text-1 outline-none transition-colors ${
                    asking
                      ? "border-accent bg-accent-soft/40"
                      : "border-border focus:border-accent"
                  }`}
                  placeholder="jawaban…"
                />
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Hapus input ke-${index + 1}`}
                  title="Hapus input ini"
                  className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-text-2 transition-colors hover:border-error hover:text-error"
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={addRow}
          className="h-8 rounded-[9px] border border-border bg-surface px-3 text-xs font-semibold text-text-1 transition-colors hover:bg-bg"
        >
          + Tambah input
        </button>
        {!isDefault && (
          <button
            type="button"
            onClick={onReset}
            className="h-8 rounded-[9px] border border-border bg-surface px-3 text-xs font-semibold text-text-2 transition-colors hover:bg-bg hover:text-text-1"
          >
            Balikin ke bawaan
          </button>
        )}
      </div>

      {inputs.length === 0 &&
        (needsInput ? (
          <p className="text-[11px] leading-relaxed text-text-2">
            Belum ada input. Program yang manggil{" "}
            <code className="font-mono">ambilInput()</code> bakal langsung
            berhenti dengan pesan error.
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed text-text-2">
            Project ini gak butuh <code className="font-mono">ambilInput()</code>{" "}
            — data awalnya udah ditulis langsung sebagai array di kode.
          </p>
        ))}
    </div>
  );
}
