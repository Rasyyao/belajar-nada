"use client";

/**
 * Provider Phase 2 buat `refineVisualization`. Cuma ngirim ringkasan trace
 * (lihat `summarizeForAi`) ke API route server-side yang megang
 * GROQ_API_KEY — gak pernah motong ke Groq langsung dari browser.
 * Gagal/timeout/key kosong semua jatuh ke `null`, biar pemanggilnya balik
 * ke layout rule-based tanpa perlu tahu alasannya.
 */
export async function requestAiRefinement(summary) {
    try {
        const res = await fetch("/api/visualize/refine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(summary),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.decision ?? null;
    } catch {
        return null;
    }
}
