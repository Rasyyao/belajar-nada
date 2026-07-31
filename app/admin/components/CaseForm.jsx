"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";
import { THEME_OPTIONS } from "../../lib/themes";
import {
  Field,
  JsonField,
  Label,
  Select,
  StringListField,
  TextArea,
  jsonError,
  parseJson,
  toJsonText,
} from "./Fields";
import TestRunPanel from "./TestRunPanel";
import { mainFunctionName } from "../../lib/functionDirectory";

/**
 * Form tambah/edit soal.
 *
 * Field JSON (`inputAwal`, `hasilAkhirTervalidasi`, `daftarFunction`, `catatanKonsep`,
 * `bandingkan`) disimpen sebagai TEKS di state dan baru di-parse pas mau kirim —
 * lihat catatan di `Fields.jsx`. Field yang isinya daftar teks biasa (hints,
 * inputs, label prompt) dapet editor sendiri, karena ngetik array JSON manual
 * buat hint yang beberapa baris itu nyiksa.
 *
 * Part-nya dipisah lewat tab, bukan ditumpuk semua ke bawah: tiap part punya
 * satu Monaco Editor, dan ngerender lima Monaco sekaligus bikin halamannya berat.
 */

const emptyPart = (partKe) => ({
  partKe,
  judulPart: "",
  tema: "",
  cerita: "",
  deskripsiSoal: "",
  namaFunction: "",
  starterCode: "function namaFunction(masukan) {\n  var hasil = [];\n  // tulis kodemu di sini\n\n  return hasil;\n}\n",
  hints: [],
  inputs: [],
  promptLabels: [],
  inputAwalText: "",
  hasilAkhirText: "",
  daftarFunctionText: JSON.stringify([
    {
      nama: "namaFunction",
      perananSingkat: "Jelaskan peran function ini.",
      parameter: [],
      return: { keterangan: "Jelaskan hasil yang dikembalikan function ini." },
      dipanggilOleh: [],
      iniFunctionUtama: true,
    },
  ], null, 2),
  catatanKonsepText: "",
  bandingkanText: "",
});

/** Bentuk dari database → state form (JSON jadi teks). */
function toFormState(initial) {
  if (!initial) {
    return {
      slug: "",
      judul: "",
      ceritaUtama: "",
      visualTheme: "",
      tipe: "berpart",
      musim: "",
      urutan: 0,
      parts: [emptyPart(1)],
    };
  }

  return {
    ...initial,
    urutan: initial.urutan ?? 0,
    parts: initial.parts.map((part) => ({
      partKe: part.partKe,
      judulPart: part.judulPart,
      tema: part.tema,
      cerita: part.cerita,
      deskripsiSoal: part.deskripsiSoal,
      namaFunction: part.namaFunction,
      starterCode: part.starterCode,
      hints: part.hints ?? [],
      inputs: part.inputs ?? [],
      promptLabels: part.promptLabels ?? [],
      inputAwalText: toJsonText(part.inputAwal),
      hasilAkhirText: toJsonText(part.hasilAkhirTervalidasi),
      daftarFunctionText: toJsonText(part.daftarFunction),
      catatanKonsepText: toJsonText(part.catatanKonsep),
      bandingkanText: toJsonText(part.bandingkan),
    })),
  };
}

const JSON_FIELDS = [
  "inputAwalText",
  "hasilAkhirText",
  "daftarFunctionText",
  "catatanKonsepText",
  "bandingkanText",
];

/** Part pertama yang punya field JSON rusak, atau `null` kalau semuanya sah. */
function findBadJson(parts) {
  for (const [index, item] of parts.entries()) {
    for (const key of JSON_FIELDS) {
      if (jsonError(item[key])) return { part: item.partKe, index, key };
    }
  }
  return null;
}

function safeParse(text) {
  try {
    return parseJson(text) ?? {};
  } catch {
    return {};
  }
}

export default function CaseForm({ initial }) {
  const router = useRouter();
  const [form, setForm] = useState(() => toFormState(initial));
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(initial?.id);
  const part = form.parts[active];

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const setPartField = (name, value) =>
    setForm((f) => ({
      ...f,
      parts: f.parts.map((item, i) => (i === active ? { ...item, [name]: value } : item)),
    }));

  const addPart = () =>
    setForm((f) => {
      const nextNumber = Math.max(0, ...f.parts.map((p) => p.partKe)) + 1;
      return { ...f, parts: [...f.parts, emptyPart(nextNumber)] };
    });

  // Soal harus selalu punya minimal satu part, jadi tombolnya baru muncul kalau
  // part-nya lebih dari satu. `setActive` dipanggil di luar updater `setForm`
  // supaya gak jadi efek samping yang kena double-invoke di Strict Mode.
  const removePart = (index) => {
    if (form.parts.length === 1) return;
    const parts = form.parts.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, parts }));
    setActive((current) => Math.min(current, parts.length - 1));
  };

  // Semua JSON di semua part harus sah dulu sebelum tombol Simpan hidup —
  // lebih baik ketahuan di sini daripada ditolak server setelah nunggu.
  // Gak di-memo: paling banyak beberapa part kali lima field, jauh lebih murah
  // ketimbang render form-nya sendiri.
  const badJson = findBadJson(form.parts);

  // Dipakai TestRunPanel buat ngebandingin hasil run sama yang lagi diketik.
  // Kalau JSON-nya lagi setengah jadi, dianggap kosong dulu — `badJson` di atas
  // yang ngasih tahu admin kalau isinya emang rusak.
  const expectedNow = safeParse(part.hasilAkhirText);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        slug: form.slug,
        judul: form.judul,
        ceritaUtama: form.ceritaUtama,
        visualTheme: form.visualTheme,
        tipe: form.tipe,
        musim: form.musim,
        urutan: form.urutan,
        parts: form.parts.map((item) => ({
          partKe: item.partKe,
          judulPart: item.judulPart,
          tema: item.tema,
          cerita: item.cerita,
          deskripsiSoal: item.deskripsiSoal,
          namaFunction: mainFunctionName(
            parseJson(item.daftarFunctionText),
            item.namaFunction,
          ),
          starterCode: item.starterCode,
          hints: item.hints.filter((hint) => hint.trim() !== ""),
          inputs: form.tipe === "mini" ? item.inputs : [],
          promptLabels: form.tipe === "mini" ? item.promptLabels : [],
          inputAwal: parseJson(item.inputAwalText),
          hasilAkhirTervalidasi: parseJson(item.hasilAkhirText),
          daftarFunction: parseJson(item.daftarFunctionText),
          catatanKonsep: parseJson(item.catatanKonsepText),
          bandingkan: parseJson(item.bandingkanText),
        })),
      };

      const res = await fetch(
        isEdit ? `/api/admin/cases/${initial.id}` : "/api/admin/cases",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? "Gagal nyimpen.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e.message ?? "Gagal nyimpen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-10">
      <section className="flex flex-col gap-4 rounded-app border border-border bg-surface p-5">
        <h2 className="font-heading text-lg text-text-1">Soal</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Slug"
            hint="jadi alamat halamannya"
            value={form.slug}
            onChange={(v) => setField("slug", v)}
            placeholder="loket-karcis-wahana"
            required
          />
          <Field
            label="Judul"
            value={form.judul}
            onChange={(v) => setField("judul", v)}
            placeholder="Loket Karcis Wahana"
            required
          />
        </div>

        <TextArea
          label="Cerita utama"
          hint="dibaca duluan sebelum part mana pun"
          value={form.ceritaUtama}
          onChange={(v) => setField("ceritaUtama", v)}
          rows={3}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Tipe"
            hint={form.tipe === "mini" ? "satu part, pakai ambilInput()" : "beberapa part, lewat tab"}
            value={form.tipe}
            onChange={(v) => setField("tipe", v)}
            options={[
              { value: "berpart", label: "Soal berpart" },
              { value: "mini", label: "Mini project" },
            ]}
          />

          {/* Input + datalist: bisa milih tema yang udah ada, bisa juga ngetik
              tema baru — tanpa perlu tombol "tema baru" terpisah. */}
          <label className="flex flex-col gap-1.5">
            <Label hint="boleh tema baru">Visual theme</Label>
            <input
              list="visual-theme-options"
              value={form.visualTheme}
              onChange={(e) => setField("visualTheme", e.target.value)}
              placeholder="loket-tiket"
              className="h-10 w-full rounded-[10px] border border-border bg-bg px-3 text-[13px] text-text-1 outline-none focus:border-accent"
            />
            <datalist id="visual-theme-options">
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </datalist>
          </label>

          <Field
            label="Urutan"
            hint="kecil = duluan"
            type="number"
            value={form.urutan}
            onChange={(v) => setField("urutan", v)}
          />
        </div>

        {form.tipe === "mini" && (
          <Select
            label="Musim"
            hint="badge di daftar soal"
            value={form.musim}
            onChange={(v) => setField("musim", v)}
            placeholder="— gak ada —"
            options={[
              { value: "gugur", label: "🍂 Gugur" },
              { value: "dingin", label: "❄️ Dingin" },
            ]}
          />
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-app border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg text-text-1">Part</h2>

          <nav className="flex flex-wrap items-center gap-1.5">
            {form.parts.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active ? "step" : undefined}
                className={`h-9 rounded-[10px] border px-3 text-[12.5px] font-semibold transition-colors ${index === active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-surface text-text-2 hover:bg-bg hover:text-text-1"
                  }`}
              >
                Part {item.partKe}
                {item.judulPart ? ` · ${item.judulPart}` : ""}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {form.parts.length > 1 && (
              <button
                type="button"
                onClick={() => removePart(active)}
                className="h-9 rounded-[10px] border border-border px-3 text-[12.5px] font-semibold text-text-2 transition-colors hover:border-error/40 hover:bg-error-soft hover:text-error"
              >
                Hapus part ini
              </button>
            )}
            {form.tipe === "berpart" && (
              <button
                type="button"
                onClick={addPart}
                className="h-9 rounded-[10px] border border-border bg-surface px-3 text-[12.5px] font-semibold text-text-1 transition-colors hover:bg-bg"
              >
                + Tambah Part
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Judul part"
            value={part.judulPart}
            onChange={(v) => setPartField("judulPart", v)}
            placeholder="Ngitung harga tiap pengunjung"
          />
          <Field
            label="Tema"
            hint="tampil di sebelah judul panel"
            value={part.tema}
            onChange={(v) => setPartField("tema", v)}
            placeholder="if-else"
          />
          <p className="rounded-[10px] border border-accent/25 bg-accent-soft/40 px-3 py-2 text-[12px] leading-relaxed text-text-2">
            Nama function utama diambil dari item <code className="font-mono">iniFunctionUtama: true</code> di Daftar Function.
          </p>
        </div>

        <TextArea
          label="Cerita part"
          value={part.cerita}
          onChange={(v) => setPartField("cerita", v)}
          rows={3}
        />

        <TextArea
          label="Deskripsi soal"
          hint="yang dikerjain siswa"
          value={part.deskripsiSoal}
          onChange={(v) => setPartField("deskripsiSoal", v)}
          rows={3}
        />

        <div className="flex flex-col gap-1.5">
          <Label hint="kode yang kelihatan pertama kali sama siswa">Starter code</Label>
          <div className="h-72 overflow-hidden rounded-app border border-border">
            <CodeEditor
              key={`starter-${active}`}
              value={part.starterCode}
              onChange={(v) => setPartField("starterCode", v)}
              activeLine={null}
              onRun={() => { }}
            />
          </div>
        </div>

        <TestRunPanel
          key={`test-${active}`}
          starterCode={part.starterCode}
          inputs={form.tipe === "mini" ? part.inputs : []}
          expected={expectedNow}
          onUseResult={(chosen) =>
            setPartField("hasilAkhirText", JSON.stringify(chosen, null, 2))
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <JsonField
            label="Hasil akhir tervalidasi"
            hint="nilai akhir tiap variabel"
            value={part.hasilAkhirText}
            onChange={(v) => setPartField("hasilAkhirText", v)}
            rows={5}
          />
          <JsonField
            label="Input awal"
            hint="data yang udah ada di kode"
            value={part.inputAwalText}
            onChange={(v) => setPartField("inputAwalText", v)}
            rows={5}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <JsonField
            label="Daftar function"
            hint="array penjelasan semua function"
            value={part.daftarFunctionText}
            onChange={(v) => setPartField("daftarFunctionText", v)}
            rows={10}
          />
          <JsonField
            label="Catatan konsep"
            hint="daftar { judul, isi }"
            value={part.catatanKonsepText}
            onChange={(v) => setPartField("catatanKonsepText", v)}
            rows={6}
          />
        </div>

        <JsonField
          label="Bandingkan"
          hint="opsional — panel dua array berdampingan"
          value={part.bandingkanText}
          onChange={(v) => setPartField("bandingkanText", v)}
          rows={4}
        />

        <StringListField
          label="Hints"
          hint="dibuka bertahap sama siswa"
          items={part.hints}
          onChange={(v) => setPartField("hints", v)}
          multiline
          placeholder="Petunjuk yang gak langsung ngasih jawaban…"
          addLabel="+ Tambah hint"
        />

        {form.tipe === "mini" && (
          <div className="grid gap-4 md:grid-cols-2">
            <StringListField
              label="Inputs"
              hint="jawaban buat ambilInput(), berurutan"
              items={part.inputs}
              onChange={(v) => setPartField("inputs", v)}
              placeholder="5"
              addLabel="+ Tambah input"
            />
            <StringListField
              label="Label prompt"
              hint="pertanyaan tiap input"
              items={part.promptLabels}
              onChange={(v) => setPartField("promptLabels", v)}
              placeholder="Musim dingin berapa hari?"
              addLabel="+ Tambah label"
            />
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-app border border-error/40 bg-error-soft px-4 py-3 text-[13px] text-error">
          {error}
        </p>
      )}

      {badJson && (
        <p className="rounded-app border border-error/40 bg-error-soft px-4 py-3 text-[13px] text-error">
          Ada field JSON di Part {badJson.part} yang belum bener — benerin dulu
          sebelum disimpen.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || Boolean(badJson)}
          className="h-10 rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {saving ? "Nyimpen…" : isEdit ? "Simpan perubahan" : "Simpan soal baru"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="h-10 rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
