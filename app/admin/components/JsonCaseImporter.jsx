"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeImportedFiles } from "../../lib/caseImport";

function badge(item) {
    return item.tipe === "mini" ? "Mini project" : "Soal berpart";
}

export default function JsonCaseImporter() {
    const router = useRouter();
    const [files, setFiles] = useState([]);
    const [preview, setPreview] = useState(null);
    const [reading, setReading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    async function handleFiles(event) {
        const selected = [...event.target.files];
        setFiles(selected);
        setPreview(null);
        setResult(null);
        if (selected.length === 0) return;

        setReading(true);
        try {
            const parsed = [];
            for (const file of selected) {
                let value;
                try {
                    value = JSON.parse(await file.text());
                } catch (error) {
                    parsed.push({ name: file.name, value: null, parseError: error.message });
                    continue;
                }
                parsed.push({ name: file.name, value });
            }
            const readable = parsed.filter((file) => !file.parseError);
            const normalized = normalizeImportedFiles(readable);
            const parseErrors = parsed
                .filter((file) => file.parseError)
                .map((file) => `${file.name}: JSON tidak valid — ${file.parseError}`);
            setPreview({
                values: normalized.values,
                errors: [...parseErrors, ...normalized.errors],
            });
        } finally {
            setReading(false);
        }
    }

    async function importAll() {
        if (!preview || preview.errors.length > 0 || preview.values.length === 0) return;
        setImporting(true);
        setResult(null);

        const successes = [];
        const failures = [];
        for (const item of preview.values) {
            const response = await fetch("/api/admin/cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...item, importMode: "upsert" }),
            });
            const body = await response.json().catch(() => ({}));
            if (response.ok) successes.push(item.slug);
            else failures.push(`${item.slug}: ${body.error ?? "gagal disimpan"}`);
        }

        setResult({ successes, failures });
        setImporting(false);
        router.refresh();
    }

    return (
        <section className="flex flex-col gap-3 rounded-app border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-heading text-lg text-text-1">Import soal dari JSON</h2>
                    <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-text-2">
                        Pilih satu atau beberapa file. Bisa pakai format lama
                        <code className="mx-1 font-mono">mini-projects.json</code> /
                        <code className="mx-1 font-mono">part-projects.json</code>, atau satu
                        object payload admin.
                    </p>
                </div>
                <label className="flex h-10 cursor-pointer items-center rounded-[10px] border border-accent/40 bg-accent-soft px-4 text-sm font-semibold text-accent hover:bg-accent/15">
                    {reading ? "Membaca…" : "Pilih JSON"}
                    <input
                        type="file"
                        accept=".json,application/json"
                        multiple
                        onChange={handleFiles}
                        disabled={reading || importing}
                        className="sr-only"
                    />
                </label>
            </div>

            {files.length > 0 && (
                <p className="text-[11px] text-text-2">{files.length} file dipilih.</p>
            )}

            {preview && (
                <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-bg p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-[11px] font-semibold tracking-wider text-text-2 uppercase">
                            Preview import
                        </h3>
                        <span className="font-mono text-[11px] text-text-2">
                            {preview.values.length} soal siap
                        </span>
                    </div>

                    {preview.values.length > 0 && (
                        <ul className="grid gap-1.5 md:grid-cols-2">
                            {preview.values.map((item) => (
                                <li key={item.slug} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-[12px]">
                                    <span className="min-w-0 truncate font-semibold text-text-1">{item.judul}</span>
                                    <span className="shrink-0 text-text-2">{badge(item)} · {item.parts.length} part</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {preview.errors.length > 0 && (
                        <div className="rounded-md border border-error/40 bg-error-soft px-3 py-2 text-[12px] leading-relaxed text-error">
                            <p className="font-semibold">Import belum bisa dijalankan:</p>
                            <ul className="mt-1 list-disc pl-4">
                                {preview.errors.map((error) => <li key={error}>{error}</li>)}
                            </ul>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={importAll}
                        disabled={importing || preview.errors.length > 0 || preview.values.length === 0}
                        className="h-10 self-start rounded-[10px] bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {importing ? "Mengimpor…" : `Import ${preview.values.length} soal`}
                    </button>
                </div>
            )}

            {result && (
                <div className={`rounded-[10px] border px-3 py-2 text-[12px] ${result.failures.length === 0 ? "border-success/40 bg-success-soft text-success" : "border-error/40 bg-error-soft text-error"}`}>
                    <p>{result.successes.length} soal berhasil diimpor.</p>
                    {result.failures.length > 0 && (
                        <ul className="mt-1 list-disc pl-4">
                            {result.failures.map((error) => <li key={error}>{error}</li>)}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
