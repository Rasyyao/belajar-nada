import { readAccess } from "./access";

/** Aturan Phase 1: array yang melewati batas ini diringkas saat divisualisasikan. */
export const ARRAY_COLLAPSE_THRESHOLD = 15;
const ARRAY_WINDOW_SIZE = 12;
const MIN_WINDOW_SIZE = 4;
const MAX_WINDOW_SIZE = 30;

const EMPTY_STEP_LAYOUT = {
    arrays: {},
    highlights: { variables: [], indexes: [] },
};

function clampWindowSize(size) {
    const n = Number(size);
    if (!Number.isFinite(n)) return null;
    return Math.min(MAX_WINDOW_SIZE, Math.max(MIN_WINDOW_SIZE, Math.round(n)));
}

function windowFor(length, focusIndex, size = ARRAY_WINDOW_SIZE) {
    const windowSize = Math.min(size, length);
    const safeFocus = Number.isInteger(focusIndex)
        ? Math.min(Math.max(focusIndex, 0), Math.max(length - 1, 0))
        : 0;
    const start = Math.min(
        Math.max(safeFocus - Math.floor(windowSize / 2), 0),
        Math.max(length - windowSize, 0),
    );

    return { windowStart: start, windowEnd: start + windowSize };
}

/**
 * Build deterministic, layout-only hints from the already-generated trace.
 * This function never changes execution data or variable values.
 *
 * `overrides` (optional) lets a reasoning pass (Phase 2 / Groq) tweak the
 * *decision* per array — collapse yes/no, window width, a human reason — but
 * it never supplies coordinates itself; the geometry is still computed here.
 */
export function buildBaselineLayout({ steps = [], codeLines = [], overrides = null }) {
    const layouts = steps.map((step) => {
        const source = codeLines[step.line - 1] ?? "";
        const access = readAccess(source, step.vars);
        const focusIndexes = access.reads.map((read) => read.index);
        const indexNames = access.reads
            .map((read) => read.indexExpr)
            .filter((expression) => /^[A-Za-z_$][\w$]*$/.test(expression));
        const arrays = {};

        for (const [name, value] of Object.entries(step.vars)) {
            if (!Array.isArray(value)) continue;

            const arrayFocus = access.reads
                .filter((read) => read.name === name)
                .map((read) => read.index);
            const focusIndex = arrayFocus[0] ?? 0;
            const override = overrides?.[name] ?? null;
            const collapseByRule = value.length > ARRAY_COLLAPSE_THRESHOLD;
            const collapsed =
                typeof override?.collapse === "boolean" ? override.collapse : collapseByRule;
            const windowSize = clampWindowSize(override?.windowSize) ?? ARRAY_WINDOW_SIZE;
            const window = collapsed
                ? windowFor(value.length, focusIndex, windowSize)
                : { windowStart: 0, windowEnd: value.length };

            arrays[name] = {
                collapsed,
                ...window,
                focusIndexes: arrayFocus,
                reason: typeof override?.reason === "string" ? override.reason.slice(0, 160) : null,
            };
        }

        return {
            arrays,
            highlights: {
                variables: [...new Set(access.reads.map((read) => read.name))],
                indexes: [...new Set(focusIndexes)],
                indexVariables: [...new Set(indexNames)],
            },
        };
    });

    return {
        source: overrides ? "groq" : "rules",
        refined: !!overrides,
        threshold: ARRAY_COLLAPSE_THRESHOLD,
        steps: layouts,
    };
}

/** Return only the active step's hints. The trace remains the source of truth. */
export function selectStepLayout(layout, stepIndex) {
    if (!layout?.steps?.length) return EMPTY_STEP_LAYOUT;
    return layout.steps[Math.min(Math.max(stepIndex, 0), layout.steps.length - 1)] ?? EMPTY_STEP_LAYOUT;
}

/** True kalau ada array di trace ini yang layak ditawarin buat disederhanakan AI. */
export function needsRefinement(baseline) {
    if (!baseline?.steps?.length) return false;
    return baseline.steps.some((step) =>
        Object.values(step.arrays).some((array) => array.collapsed),
    );
}

/**
 * Ringkasan trace buat dikirim ke pass reasoning (Phase 2) — bukan trace
 * mentah. Groq cuma dikasih nama array + ukuran maksimalnya sepanjang
 * eksekusi, dan cuplikan kode; gak pernah dikasih koordinat atau nilai per
 * langkah, jadi gak ada cara buat dia "mengarang" ulang eksekusinya.
 */
export function summarizeForAi({ trace = [], codeLines = [], baseline }) {
    const maxLengths = new Map();
    for (const step of trace) {
        for (const [name, value] of Object.entries(step.vars)) {
            if (!Array.isArray(value)) continue;
            const current = maxLengths.get(name) ?? 0;
            if (value.length > current) maxLengths.set(name, value.length);
        }
    }

    const arrays = [...maxLengths.entries()]
        .filter(([, maxLength]) => maxLength > (baseline?.threshold ?? ARRAY_COLLAPSE_THRESHOLD))
        .map(([name, maxLength]) => ({ name, maxLength }));

    return {
        stepCount: trace.length,
        threshold: baseline?.threshold ?? ARRAY_COLLAPSE_THRESHOLD,
        arrays,
        code: codeLines.join("\n").slice(0, 4000),
    };
}

/**
 * Refinement boundary for Phase 2.
 *
 * `provider` receives only the compact summary from `summarizeForAi`, never
 * the raw trace — it returns layout *decisions* (collapse/windowSize/reason
 * per array name), which get replayed through `buildBaselineLayout` so the
 * actual geometry is always computed locally, never trusted from the AI.
 * Any failure (no provider, nothing to refine, network error, malformed
 * response) falls back to the rule-based baseline untouched.
 */
export async function refineVisualization({ trace, baseline, codeLines = [], provider = null }) {
    if (!provider || !needsRefinement(baseline)) return baseline;

    const summary = summarizeForAi({ trace, codeLines, baseline });

    let decision = null;
    try {
        decision = await provider(summary);
    } catch {
        return baseline;
    }

    if (!decision || typeof decision !== "object" || typeof decision.arrays !== "object") {
        return baseline;
    }

    const refined = buildBaselineLayout({ steps: trace, codeLines, overrides: decision.arrays });

    return {
        ...refined,
        reason: typeof decision.summary === "string" ? decision.summary.slice(0, 240) : null,
    };
}
