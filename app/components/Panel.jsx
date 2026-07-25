/** Kartu panel standar: judul + keterangan kecil + isi yang bisa di-scroll sendiri. */
export default function Panel({
  title,
  hint,
  action,
  children,
  bodyClass = "",
  className = "",
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-app border border-border bg-surface ${className}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="font-heading text-base leading-none text-text-1">
            {title}
          </h2>
          {hint ? (
            <span className="truncate text-[11px] text-text-2">{hint}</span>
          ) : null}
        </div>
        {action}
      </header>
      <div className={`thin-scroll min-h-0 flex-1 overflow-auto ${bodyClass}`}>
        {children}
      </div>
    </section>
  );
}
