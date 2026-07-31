"use client";

import { useCallback, useState } from "react";
import { needsRefinement, refineVisualization } from "./visualizationRefinement";
import { requestAiRefinement } from "./aiRefinementClient";

/**
 * State machine buat toggle "Sederhanakan tampilan" di panel visualisasi.
 *
 * Dipisah dari perhitungan baseline (rule-based) supaya panggilan Groq
 * gak pernah nge-block render langkah — baseline udah kepasang instan lewat
 * `result.visualizationLayout`, hook ini cuma nawarin upgrade opsional.
 * Hasil AI di-cache per `result` (referensi baru = trace baru = cache
 * kebuang), jadi mondar-mandir antar langkah gak refetch Groq tiap kali.
 */
export function useAiSimplify(result) {
    const [phase, setPhase] = useState("idle"); // idle | loading | ready | error
    const [aiLayout, setAiLayout] = useState(null);
    const [showAi, setShowAi] = useState(false);
    const [reason, setReason] = useState(null);
    // Reset semua state AI pas `result` ganti (run baru/pindah part), tanpa
    // useEffect — pola "adjust state during render" yang React sendiri
    // sarankan buat kasus "reset semua state kalau prop tertentu berubah".
    const [trackedResult, setTrackedResult] = useState(result);

    if (result !== trackedResult) {
        setTrackedResult(result);
        setPhase("idle");
        setAiLayout(null);
        setShowAi(false);
        setReason(null);
    }

    const baseline = result?.visualizationLayout ?? null;
    const available = !!baseline && needsRefinement(baseline);

    const toggle = useCallback(() => {
        if (showAi) {
            setShowAi(false);
            return;
        }
        if (aiLayout) {
            setShowAi(true);
            return;
        }
        if (!result?.visualizationLayout || phase === "loading") return;

        setPhase("loading");
        refineVisualization({
            trace: result.steps,
            baseline: result.visualizationLayout,
            codeLines: (result.ranCode ?? "").split("\n"),
            provider: requestAiRefinement,
        })
            .then((layout) => {
                if (layout?.refined) {
                    setAiLayout(layout);
                    setReason(layout.reason ?? null);
                    setShowAi(true);
                    setPhase("ready");
                } else {
                    setPhase("error");
                }
            })
            .catch(() => setPhase("error"));
    }, [showAi, aiLayout, result, phase]);

    const activeLayout = showAi && aiLayout ? aiLayout : baseline;

    return { available, phase, showAi, reason, activeLayout, toggle };
}
