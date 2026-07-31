"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { groupReadsByName, indexUsage } from "../lib/access";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Teks polos untuk kotak yang lagi disorot (di sana warnanya sudah putih). */
function inlineText(value) {
  if (typeof value === "string") return `"${value}"`;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ScalarValue({ value }) {
  if (typeof value === "string") {
    return <span className="text-success">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number") {
    return <span className="text-accent">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-worked">{String(value)}</span>;
  }
  if (value === null) return <span className="text-text-2">null</span>;
  return <span className="text-text-2">{String(value)}</span>;
}

/**
 * Penunjuk di atas satu kotak array: chip label + segitiga kecil.
 * Slotnya selalu disediakan (walau kosong) supaya kotaknya gak loncat naik-turun
 * pas penunjuknya pindah antar langkah.
 */
function Pointer({ label, tone, reserve }) {
  const tones = {
    accent: "border-accent/40 bg-accent-soft text-accent",
    worked: "border-worked/40 bg-worked-soft text-worked",
    error: "border-error/40 bg-error-soft text-error",
  };
  return (
    <div
      className={`flex flex-col items-center justify-end ${reserve ? "h-7" : "h-0"
        }`}
    >
      {label ? (
        <>
          <span
            className={`no-liga rounded-md border px-1.5 py-px font-mono text-[10px] leading-tight font-semibold whitespace-nowrap ${tones[tone]}`}
          >
            {label}
          </span>
          <span
            aria-hidden
            className={`text-[9px] leading-none ${tone === "accent"
                ? "text-accent"
                : tone === "error"
                  ? "text-error"
                  : "text-worked"
              }`}
          >
            ▼
          </span>
        </>
      ) : null}
    </div>
  );
}

function ArrayValue({ value, prev, reads, call, stepKey, layoutHint = null }) {
  const prevArr = Array.isArray(prev) ? prev : null;
  const readByIndex = new Map(reads.map((read) => [read.index, read]));
  const showGhost = call?.method === "push";
  // Kotak yang bakal dicabut pop()/shift() — masih kelihatan di langkah ini,
  // baru hilang di langkah berikutnya. Ditandain biar "berkurang" gak cuma
  // kejadian diam-diam antar langkah.
  const leavingIndex = call && !call.adds ? call.leavingIndex : null;
  // Baris penunjuk cuma makan tempat kalau di langkah ini memang ada yang nunjuk.
  const reservePointerRow =
    reads.length > 0 || showGhost || leavingIndex !== null;
  const shouldCollapse = layoutHint?.collapsed === true;
  const windowStart = shouldCollapse ? layoutHint.windowStart : 0;
  const windowEnd = shouldCollapse ? layoutHint.windowEnd : value.length;
  const visibleItems = value.slice(windowStart, windowEnd);

  if (value.length === 0 && !showGhost) {
    return (
      <div className="inline-flex h-12 items-center rounded-[10px] border border-dashed border-border px-4 font-mono text-sm text-text-2">
        masih kosong
      </div>
    );
  }

  return (
    <div className="thin-scroll overflow-x-auto pb-1">
      {shouldCollapse && (
        <p className="mb-2 text-[11px] text-text-2">
          Sliding window · indeks {windowStart}–{windowEnd - 1} dari {value.length}
          {layoutHint?.reason ? ` · ${layoutHint.reason}` : ""}
        </p>
      )}
      {/* Rel slot: bikin array kebaca sebagai kotak-kotak yang nyambung,
          bukan chip yang ngambang sendiri-sendiri. */}
      <div className="inline-flex gap-1 rounded-xl border border-border bg-bg p-1.5">
        {windowStart > 0 && (
          <motion.div layout className="flex shrink-0 items-center px-1 font-mono text-sm text-text-2">
            …
          </motion.div>
        )}
        <AnimatePresence initial={false} mode="popLayout">
          {visibleItems.map((item, offset) => {
            const index = windowStart + offset;
            const isNew = !prevArr || index >= prevArr.length;
            const changed = isNew || !same(prevArr[index], item);
            const read = readByIndex.get(index);
            const leaving = index === leavingIndex;

            return (
              <motion.div
                key={index}
                layout
                initial={false}
                animate={{ opacity: leaving ? 0.65 : 1, scale: leaving ? 0.88 : 1 }}
                transition={{ layout: { type: "spring", stiffness: 500, damping: 35 } }}
                className="shrink-0 text-center"
              >
                <Pointer
                  label={
                    leaving
                      ? "keluar dari sini"
                      : read
                        ? (read.detail ?? `indeks ${read.index}`)
                        : null
                  }
                  tone={leaving ? "error" : "accent"}
                  reserve={reservePointerRow}
                />
                {/* `key` ikut nomor langkah supaya kotaknya mount ulang tiap
                  langkah — itu satu-satunya cara CSS animation-nya main lagi,
                  bukan cuma sekali pas pertama kali kerender. */}
                <motion.div
                  key={`${stepKey}-${isNew ? "in" : leaving ? "out" : "tetap"}`}
                  layout
                  initial={isNew ? { opacity: 0, scale: 0.72 } : false}
                  animate={{ opacity: leaving ? 0.65 : 1, scale: leaving ? 0.88 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={`flex h-12 min-w-12 items-center justify-center rounded-lg border px-2.5 font-mono text-base ${isNew ? "anim-slot-in" : leaving ? "anim-slot-out" : ""
                    } ${leaving
                      ? "border-dashed border-error bg-error-soft font-semibold text-error line-through decoration-error/60"
                      : changed
                        ? "border-worked bg-worked text-white shadow-[0_2px_8px_rgba(122,90,248,0.28)]"
                        : read
                          ? "border-accent bg-accent-soft text-accent font-semibold"
                          : "border-border bg-surface text-text-1"
                    } ${changed && read && !leaving ? "ring-2 ring-accent ring-offset-1" : ""}`}
                >
                  {leaving || changed ? (
                    inlineText(item)
                  ) : typeof item === "object" && item !== null ? (
                    JSON.stringify(item)
                  ) : (
                    <ScalarValue value={item} />
                  )}
                </motion.div>
                <div
                  className={`mt-1 font-mono text-[10px] tabular-nums ${leaving
                      ? "font-semibold text-error"
                      : read
                        ? "font-semibold text-accent"
                        : "text-text-2"
                    }`}
                >
                  {index}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {windowEnd < value.length && (
          <motion.div layout className="flex shrink-0 items-center px-1 font-mono text-sm text-text-2">
            …
          </motion.div>
        )}

        {/* Slot tujuan buat `push()` — nunjukin ke mana isi barunya bakal jatuh. */}
        <AnimatePresence initial={false}>
          {showGhost && (!shouldCollapse || windowEnd === value.length) && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.72 }}
              className="shrink-0 text-center"
            >
              <Pointer label="masuk sini" tone="worked" reserve />
              <motion.div
                key={`ghost-${stepKey}`}
                layout
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                className="anim-slot-in flex h-12 min-w-12 items-center justify-center rounded-lg border border-dashed border-worked/60 px-2.5 font-mono text-base text-worked/70"
              >
                +
              </motion.div>
              <div className="mt-1 font-mono text-[10px] font-semibold text-worked tabular-nums">
                {call.nextIndex}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ObjectValue({ value }) {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return (
      <div className="inline-flex h-12 items-center rounded-[10px] border border-dashed border-border px-4 font-mono text-sm text-text-2">
        masih kosong
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="rounded-[10px] border border-border bg-bg px-3 py-2 font-mono text-sm"
        >
          <span className="text-text-2">{key}:</span>{" "}
          {typeof val === "object" && val !== null ? (
            JSON.stringify(val)
          ) : (
            <ScalarValue value={val} />
          )}
        </div>
      ))}
    </div>
  );
}

function VarCard({ name, value, prev, isNew, changed, reads, call, pointsTo, stepKey, layoutHint }) {
  const isArray = Array.isArray(value);
  const isObject = !isArray && typeof value === "object" && value !== null;
  const touched = reads.length > 0 || !!call || pointsTo.length > 0;

  const kind = isArray
    ? `array · ${value.length} isi`
    : isObject
      ? "object"
      : typeof value;

  // Buat array, bilang isinya NAMBAH atau BERKURANG — bukan cuma "berubah".
  // Bedanya penting di soal yang push dan pop-nya campur dalam satu loop.
  const delta =
    isArray && Array.isArray(prev) ? value.length - prev.length : 0;
  const changeLabel =
    delta > 0
      ? `+${delta} masuk`
      : delta < 0
        ? `${delta} keluar`
        : "berubah di sini";

  // Array panjang (dan object) butuh lebar penuh — kalau dipaksa setengah kolom,
  // kotak-kotaknya kepotong dan malah harus di-scroll pas lagi ngajar.
  // Isi berupa teks (misal ["Kenari", "Almond", "Kastanye"]) makan tempat jauh
  // lebih lebar dari angka, jadi panjang teksnya ikut dihitung, bukan cuma jumlah isi.
  const arrayTextWidth = isArray
    ? value.reduce((total, item) => total + String(item).length + 3, 0)
    : 0;
  const needsFullWidth =
    (isArray && (value.length > 4 || arrayTextWidth > 24)) || isObject || !!call;

  return (
    <motion.div
      layout
      transition={{ layout: { type: "spring", stiffness: 420, damping: 32 } }}
      animate={{ scale: changed ? [1, 1.012, 1] : 1 }}
      className={`relative overflow-hidden rounded-app border px-4 py-3 transition-colors ${needsFullWidth ? "md:col-span-2 xl:col-span-1 2xl:col-span-2" : ""
        } ${changed ? "anim-var-pulse" : ""} ${changed
          ? "border-worked/40 bg-worked-soft"
          : touched
            ? "border-accent/40 bg-surface"
            : "border-border bg-surface"
        }`}
    >
      {/* Rel warna di tepi kiri: ungu = isinya berubah, biru = lagi disentuh. */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 ${changed ? "bg-worked" : touched ? "bg-accent" : "bg-border"
          }`}
      />

      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-[15px] font-semibold tracking-tight text-text-1">
          {name}
        </span>
        <span className="text-[11px] text-text-2">{kind}</span>
        {call && (
          <span className="no-liga rounded-full bg-worked-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-worked">
            .{call.method}()
          </span>
        )}
        {changed && (
          <span
            className={`ml-auto shrink-0 text-[11px] font-medium ${delta < 0 ? "text-error" : "text-worked"
              }`}
          >
            {isNew ? "baru muncul" : changeLabel}
          </span>
        )}
      </div>

      {isArray ? (
        <ArrayValue
          value={value}
          prev={prev}
          reads={reads}
          call={call}
          stepKey={stepKey}
          layoutHint={layoutHint}
        />
      ) : isObject ? (
        <ObjectValue value={value} />
      ) : (
        <div className="font-mono text-2xl leading-none">
          <ScalarValue value={value} />
        </div>
      )}

      {/* Kalau variabel ini dipakai sebagai indeks, sebutin dia lagi nunjuk ke mana. */}
      {pointsTo.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1">
          {pointsTo.map((read) => (
            <span
              key={`${read.name}-${read.index}`}
              className="no-liga font-mono text-[11px] text-accent"
            >
              ↳ nunjuk ke {read.name}[{read.index}]
              {read.inRange ? ` = ${JSON.stringify(read.value)}` : " · di luar jangkauan"}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Semua variabel yang hidup di satu langkah, dirender berdampingan supaya
 * kelihatan KAPAN counter loop berubah versus KAPAN variabel hasil ikut berubah.
 * `order` bikin posisi kartu tetap sepanjang eksekusi, jadi mata gak perlu
 * nyari ulang tiap kali maju satu langkah.
 */
export default function VarBoard({ vars, prevVars, order, access, stepKey, layoutHints = null }) {
  const names = order.filter((name) => name in vars);
  const readsByName = groupReadsByName(access.reads);
  const indexUsers = indexUsage(access.reads);

  if (names.length === 0) {
    return (
      <MotionConfig reducedMotion="user">
        <p className="rounded-app border border-dashed border-border px-4 py-8 text-center text-sm text-text-2">
          Belum ada variabel di langkah ini — maju satu langkah lagi.
        </p>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {names.map((name) => {
          const prev = prevVars ? prevVars[name] : undefined;
          const isNew = !prevVars || !(name in prevVars);
          const changed = isNew || !same(vars[name], prev);

          return (
            <VarCard
              // Kartu yang isinya berubah dikasih `key` yang ikut nomor langkah
              // supaya mount ulang dan pulse-nya main lagi. Kartu yang diam
              // key-nya tetap — posisinya gak boleh goyang tiap ganti langkah.
              key={changed ? `${name}-${stepKey}` : name}
              name={name}
              value={vars[name]}
              prev={prev}
              isNew={isNew}
              changed={changed}
              reads={readsByName.get(name) ?? []}
              call={access.calls.find((item) => item.name === name) ?? null}
              pointsTo={indexUsers.get(name) ?? []}
              stepKey={stepKey}
              layoutHint={layoutHints?.arrays?.[name] ?? null}
            />
          );
        })}
      </div>
    </MotionConfig>
  );
}
