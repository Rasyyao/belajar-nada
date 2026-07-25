"use client";

import { useEffect, useRef } from "react";

/**
 * Rangka popup, dipakai bareng popup Pseudocode dan popup Hint.
 *
 * Pakai <dialog> bawaan browser, bukan div overlay bikinan sendiri — biar dapet
 * Esc buat nutup, fokus kekunci di dalam popup, dan latar belakangnya non-aktif
 * tanpa perlu ngurus itu manual.
 *
 * Isi popup cuma dirender waktu kebuka, jadi nilai di dalamnya (misal isi
 * textarea) gak pernah beda antara hasil render server dan browser.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "40rem",
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        // Klik di luar kotak (alias di backdrop) targetnya elemen dialog itu sendiri.
        if (event.target === dialogRef.current) onClose();
      }}
      style={{ width: `min(${width}, 92vw)` }}
      className="m-auto rounded-app border border-border bg-surface p-0 text-text-1 backdrop:bg-text-1/40 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-lg leading-none text-text-1">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-2">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-text-2 transition-colors hover:bg-bg hover:text-text-1"
            >
              ×
            </button>
          </header>

          <div className="thin-scroll min-h-0 flex-1 overflow-auto p-5">
            {children}
          </div>

          {footer && (
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
