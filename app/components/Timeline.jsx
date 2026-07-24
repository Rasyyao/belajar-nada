"use client";

import { useCallback, useRef } from "react";

/** Maksimum kolom yang digambar — rekaman panjang di-downsample biar tetap enteng. */
const MAX_COLUMNS = 420;

const HEIGHT = 60;

/**
 * Jejak eksekusi: satu kolom = satu langkah, posisi vertikalnya = nomor baris.
 * Loop kebaca sebagai pola gerigi yang berulang, dan percabangan `if` yang
 * gak kepilih kelihatan sebagai baris yang dilewat — jadi siswa bisa lihat
 * BENTUK jalannya program, bukan cuma angka langkah.
 *
 * Strip ini sekaligus jadi kontrol scrub: klik atau seret buat lompat langkah.
 */
export default function Timeline({ steps, current, totalLines, onSeek }) {
  const svgRef = useRef(null);
  const draggingRef = useRef(false);

  const count = steps.length;
  const stride = Math.max(1, Math.ceil(count / MAX_COLUMNS));
  const columns = [];
  for (let i = 0; i < count; i += stride) columns.push(i);

  const lines = Math.max(totalLines, 1);
  const rowHeight = Math.max(HEIGHT / lines, 2.5);
  const columnWidth = columns.length;

  const seekFromEvent = useCallback(
    (event) => {
      const svg = svgRef.current;
      if (!svg || count === 0) return;
      const rect = svg.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      const index = Math.round(ratio * (count - 1));
      onSeek(Math.min(Math.max(index, 0), count - 1));
    },
    [count, onSeek],
  );

  if (count === 0) return null;

  const currentColumn = Math.min(
    Math.floor(current / stride),
    columns.length - 1,
  );

  return (
    <div className="flex min-w-0 flex-1 items-stretch gap-2">
      <div className="flex shrink-0 flex-col justify-between py-0.5 text-right font-mono text-[9px] leading-none text-text-2">
        <span>brs 1</span>
        <span>brs {lines}</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${columnWidth} ${HEIGHT}`}
        preserveAspectRatio="none"
        height={HEIGHT}
        className="h-[60px] w-full min-w-0 cursor-pointer touch-none rounded-[10px] border border-border bg-surface"
        role="slider"
        tabIndex={0}
        aria-label="Jejak eksekusi — klik untuk lompat ke langkah tertentu"
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={current + 1}
        onPointerDown={(event) => {
          draggingRef.current = true;
          seekFromEvent(event);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch (e) {
            // Pointer capture cuma buat kenyamanan seret; kalau ditolak, klik biasa tetap jalan.
          }
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) seekFromEvent(event);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") onSeek(Math.min(current + 1, count - 1));
          if (event.key === "ArrowLeft") onSeek(Math.max(current - 1, 0));
        }}
      >
        {columns.map((stepIndex, columnIndex) => {
          const line = steps[stepIndex].line;
          const y = ((line - 1) / lines) * HEIGHT;
          const isPast = stepIndex <= current;
          const isCurrent = columnIndex === currentColumn;
          return (
            <rect
              key={stepIndex}
              x={columnIndex}
              y={y}
              width={0.85}
              height={rowHeight}
              rx={0.4}
              fill={
                isCurrent
                  ? "var(--color-worked)"
                  : isPast
                    ? "var(--color-accent)"
                    : "var(--color-border)"
              }
            />
          );
        })}

        <rect
          x={currentColumn}
          y={0}
          width={0.85}
          height={HEIGHT}
          fill="var(--color-worked)"
          opacity={0.14}
        />
      </svg>
    </div>
  );
}
