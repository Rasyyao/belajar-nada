"use client";

import Modal from "./Modal";

const TEMPLATE = `MULAI
  siapkan wadah kosong namanya ...

  ULANGI sebanyak ...
    JIKA ...
      ...
    SELESAI JIKA
  SELESAI ULANGI

  kembalikan ...
SELESAI`;

/** Popup buat nulis pseudocode dulu sebelum ngoding. */
export default function PseudocodeDialog({
  open,
  onClose,
  value,
  onChange,
  projectTitle,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pseudocode"
      subtitle={`Rencanain dulu pakai bahasa sendiri buat ${projectTitle}, baru terjemahin ke kode. Catatannya kesimpen di browser ini.`}
      footer={
        <>
          {value.trim().length === 0 ? (
            <button
              type="button"
              onClick={() => onChange(TEMPLATE)}
              className="h-9 rounded-[10px] border border-border bg-surface px-3.5 text-xs font-semibold text-text-1 transition-colors hover:bg-bg"
            >
              Pakai kerangka
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-9 rounded-[10px] border border-border bg-surface px-3.5 text-xs font-semibold text-text-2 transition-colors hover:bg-bg hover:text-text-1"
            >
              Kosongin
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Selesai
          </button>
        </>
      }
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoFocus
        rows={14}
        className="no-liga thin-scroll w-full resize-y rounded-app border border-border bg-bg p-3.5 font-mono text-[13px] leading-relaxed text-text-1 outline-none focus:border-accent"
        placeholder={TEMPLATE}
      />
    </Modal>
  );
}
