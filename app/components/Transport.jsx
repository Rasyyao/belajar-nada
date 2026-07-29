"use client";

import Timeline from "./Timeline";
import { SPEEDS } from "../lib/useStepPlayer";

function TransportButton({ children, label, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-sm font-medium text-text-1 transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-35"
      {...props}
    >
      {children}
    </button>
  );
}

/** Kontrol pemutaran langkah. `embedded` dipakai di kartu visualisasi soal. */
export default function Transport({
  player,
  steps,
  totalLines,
  idleHint,
  embedded = false,
}) {
  const { current, atEnd, isPlaying, speed, setSpeed, seek, togglePlay } =
    player;

  if (embedded) {
    if (steps.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <TransportButton
          label="Mundur satu langkah"
          onClick={() => seek(Math.max(current - 1, 0))}
          disabled={current === 0}
        >
          ←
        </TransportButton>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Jeda" : atEnd ? "Putar ulang" : "Putar"}
          className="flex h-10 min-w-24 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          {isPlaying ? "⏸ Jeda" : atEnd ? "↻ Ulangi" : "▶ Putar"}
        </button>
        <TransportButton
          label="Maju satu langkah"
          onClick={() => seek(Math.min(current + 1, steps.length - 1))}
          disabled={atEnd}
        >
          →
        </TransportButton>
        <span className="ml-auto font-mono text-xs text-text-2 tabular-nums">
          langkah {current + 1} / {steps.length}
        </span>
      </div>
    );
  }

  return (
    <footer className="sticky bottom-0 shrink-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur">
      {steps.length === 0 ? (
        <p className="text-center text-[13px] text-text-2">{idleHint}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <div className="flex items-center gap-1.5">
            <TransportButton
              label="Ke langkah pertama"
              onClick={() => seek(0)}
              disabled={current === 0}
            >
              ⏮
            </TransportButton>
            <TransportButton
              label="Mundur satu langkah"
              onClick={() => seek(Math.max(current - 1, 0))}
              disabled={current === 0}
            >
              ←
            </TransportButton>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Jeda" : atEnd ? "Putar ulang" : "Putar"}
              className="flex h-10 min-w-24 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              {isPlaying ? "⏸ Jeda" : atEnd ? "↻ Ulangi" : "▶ Putar"}
            </button>
            <TransportButton
              label="Maju satu langkah"
              onClick={() => seek(Math.min(current + 1, steps.length - 1))}
              disabled={atEnd}
            >
              →
            </TransportButton>
            <TransportButton
              label="Ke langkah terakhir"
              onClick={() => seek(steps.length - 1)}
              disabled={atEnd}
            >
              ⏭
            </TransportButton>
          </div>

          <div className="flex h-10 items-center rounded-[10px] border border-border bg-surface p-1">
            {SPEEDS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSpeed(option.ms)}
                className={`h-8 rounded-[7px] px-2.5 font-mono text-xs transition-colors ${speed === option.ms
                    ? "bg-accent-soft font-semibold text-accent"
                    : "text-text-2 hover:text-text-1"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Timeline
            steps={steps}
            current={current}
            totalLines={totalLines}
            onSeek={seek}
          />

          <div className="flex shrink-0 items-baseline gap-1.5 font-mono text-sm text-text-2 tabular-nums">
            <span className="text-lg font-semibold text-text-1">
              {current + 1}
            </span>
            <span>/ {steps.length}</span>
          </div>
        </div>
      )}
    </footer>
  );
}
