"use client";

/**
 * Kontrol form yang dipakai ulang di form Soal dan form Materi.
 *
 * Field JSON sengaja nyimpen TEKS mentahnya, bukan hasil parse-nya: kalau
 * disimpen sebagai objek, tiap ketikan yang belum jadi JSON valid bakal ilang.
 * Parse-nya baru pas mau disimpen — errornya ditampilin di bawah kotaknya.
 */

const inputClass =
  "w-full rounded-[10px] border border-border bg-bg px-3 py-2 text-[13px] text-text-1 outline-none focus:border-accent";

export function Label({ children, hint }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
        {children}
      </span>
      {hint && <span className="text-[11px] text-text-2 normal-case">{hint}</span>}
    </span>
  );
}

export function Field({ label, hint, value, onChange, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 ${inputClass}`}
        {...rest}
      />
    </label>
  );
}

export function TextArea({ label, hint, value, onChange, rows = 3, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className={`resize-y leading-relaxed ${inputClass}`}
        {...rest}
      />
    </label>
  );
}

export function Select({ label, hint, value, onChange, options, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 ${inputClass}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Kotak JSON. `value` selalu string; `error` dihitung ulang tiap render supaya
 * admin tahu JSON-nya rusak SEBELUM mencet Simpan.
 */
export function JsonField({ label, hint, value, onChange, rows = 4 }) {
  const error = jsonError(value);

  return (
    <label className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className={`no-liga resize-y font-mono text-[12.5px] leading-relaxed ${inputClass} ${
          error ? "border-error" : ""
        }`}
      />
      {error && <span className="text-[11px] text-error">JSON-nya belum bener: {error}</span>}
    </label>
  );
}

/** `null` kalau teksnya kosong atau JSON-nya sah; pesan error kalau enggak. */
export function jsonError(text) {
  if (!text || text.trim() === "") return null;
  try {
    JSON.parse(text);
    return null;
  } catch (e) {
    return e.message;
  }
}

/** Teks kosong → `null` (kolom jsonb-nya dikosongin), bukan lempar error. */
export function parseJson(text) {
  if (!text || text.trim() === "") return null;
  return JSON.parse(text);
}

export function toJsonText(value) {
  if (value === null || value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

/**
 * Daftar teks yang bisa ditambah/dihapus — buat hints, inputs, dan label prompt.
 * Jauh lebih enak dipakai ketimbang ngetik array JSON manual, terutama buat
 * hints yang isinya beberapa baris.
 */
export function StringListField({
  label,
  hint,
  items,
  onChange,
  placeholder,
  multiline = false,
  addLabel = "+ Tambah",
}) {
  const update = (index, value) =>
    onChange(items.map((item, i) => (i === index ? value : item)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>

      {items.length === 0 && (
        <p className="text-[12px] text-text-2">Belum ada isinya.</p>
      )}

      <ol className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-2.5 w-5 shrink-0 text-right font-mono text-[11px] text-text-2 tabular-nums">
              {index + 1}
            </span>
            {multiline ? (
              <textarea
                value={item}
                onChange={(e) => update(index, e.target.value)}
                rows={2}
                placeholder={placeholder}
                className={`resize-y leading-relaxed ${inputClass}`}
              />
            ) : (
              <input
                value={item}
                onChange={(e) => update(index, e.target.value)}
                placeholder={placeholder}
                className={`h-10 ${inputClass}`}
              />
            )}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Hapus item ${index + 1}`}
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border text-text-2 transition-colors hover:border-error/40 hover:bg-error-soft hover:text-error"
            >
              ×
            </button>
          </li>
        ))}
      </ol>

      <div>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="rounded-[10px] border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-1 transition-colors hover:bg-bg"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
