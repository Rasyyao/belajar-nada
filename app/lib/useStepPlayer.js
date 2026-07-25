"use client";

import { useCallback, useEffect, useState } from "react";

export const SPEEDS = [
  { label: "0,5×", ms: 850 },
  { label: "1×", ms: 420 },
  { label: "2×", ms: 170 },
];

/**
 * State pemutaran langkah: posisi sekarang, jalan otomatis, dan pintasan
 * keyboard (panah maju-mundur, spasi putar/jeda).
 *
 * Dipakai bareng oleh Playground dan halaman Mini Project supaya kontrolnya
 * berperilaku sama persis di dua tempat.
 */
export function useStepPlayer(steps) {
  const [rawCurrent, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(SPEEDS[1].ms);

  const count = steps.length;
  // Dijaga tetap di dalam jangkauan: hasil run baru bisa lebih pendek dari yang lama.
  const current = count === 0 ? 0 : Math.min(rawCurrent, count - 1);
  const atEnd = current >= count - 1;
  // Sampai di ujung = otomatis berhenti, tanpa perlu nulis balik state dari effect.
  const isPlaying = playing && !atEnd;

  const seek = useCallback((index) => {
    setPlaying(false);
    setCurrent(index);
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setCurrent(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (count === 0) return;
    if (isPlaying) {
      setPlaying(false);
      return;
    }
    if (atEnd) setCurrent(0);
    setPlaying(true);
  }, [isPlaying, atEnd, count]);

  // Jalan otomatis: satu langkah per tick. Begitu nyampe langkah terakhir,
  // effect ini berhenti jadwalin tick berikutnya dengan sendirinya.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(
      () => setCurrent((c) => Math.min(c + 1, count - 1)),
      speed,
    );
    return () => clearTimeout(id);
  }, [isPlaying, current, speed, count]);

  useEffect(() => {
    if (count === 0) return;
    const onKeyDown = (event) => {
      const el = document.activeElement;
      const typing =
        el &&
        (el.tagName === "TEXTAREA" ||
          el.tagName === "INPUT" ||
          el.closest?.(".monaco-editor"));
      if (typing) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setCurrent((c) => Math.min(c + 1, count - 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setCurrent((c) => Math.max(c - 1, 0));
      } else if (event.key === " " && el?.tagName !== "BUTTON") {
        event.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, togglePlay]);

  return {
    current,
    atEnd,
    isPlaying,
    speed,
    setSpeed,
    seek,
    reset,
    togglePlay,
    step: steps[current] ?? null,
    prevStep: current > 0 ? steps[current - 1] : null,
    lastStep: count > 0 ? steps[count - 1] : null,
  };
}
