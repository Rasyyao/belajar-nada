"use client";

function format(value) {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value) ?? String(value);
}

/** Ambil literal input sederhana dari starter code lama sebagai fallback. */
function inferInputExample(starterCode) {
  if (!starterCode) return {};

  const found = {};
  const declaration =
    /\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*(\[[^\n;]*\]|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|-?\d+(?:\.\d+)?|true|false|null)\s*;/g;

  for (const match of starterCode.matchAll(declaration)) {
    try {
      const value = JSON.parse(match[2].replace(/'/g, '"'));
      // Variabel hasil sementara seperti [] bukan contoh input yang berguna.
      if (Array.isArray(value) && value.length === 0) continue;
      if (!(match[1] in found)) found[match[1]] = value;
    } catch {
      // Literal JavaScript yang tidak valid sebagai JSON dilewati.
    }
  }

  return found;
}

function ExampleSection({ title, entries, tone = "text-accent" }) {
  if (entries.length === 0) return null;

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="bg-bg px-4 py-1.5">
        <h4
          className={`text-[10px] font-semibold tracking-wider uppercase ${tone}`}
        >
          {title}
        </h4>
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

/**
 * Contoh input + target hasil akhir, ditempel di bagian atas panel visualisasi.
 *
 * Input bisa berasal dari data awal di kode atau jawaban ambilInput(). Kalau
 * data awal belum disimpan di database lama, starter code dipakai sebagai
 * fallback supaya siswa tetap melihat contoh lengkap.
 */
export default function ExpectedResult({
  expected,
  inputExample,
  starterCode,
  inputs = [],
  labels = [],
  edited,
  onResetInputs,
}) {
  const outputEntries = Object.entries(expected ?? {});
  const dataEntries = Object.entries(inputExample ?? {});
  const inferredEntries =
    dataEntries.length > 0
      ? dataEntries
      : Object.entries(inferInputExample(starterCode));
  const promptEntries = inputs.map((value, index) => [
    labels[index] ?? `Jawaban input ke-${index + 1}`,
    value,
  ]);

  if (
    outputEntries.length === 0 &&
    inferredEntries.length === 0 &&
    promptEntries.length === 0
  ) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-app border border-accent/30">
      <div className="flex items-baseline gap-2 border-b border-border bg-accent-soft/45 px-4 py-2">
        <span aria-hidden className="text-text-2">
          ↔
        </span>
        <h3 className="text-[10px] font-semibold tracking-wider text-accent uppercase">
          Contoh input &amp; output
        </h3>
      </div>

      <ExampleSection title="Input contoh" entries={inferredEntries} />
      <ExampleSection
        title="Jawaban yang disuapkan ke ambilInput()"
        entries={promptEntries}
      />
      <ExampleSection
        title="Output yang diharapkan"
        entries={outputEntries}
        tone="text-success"
      />

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
