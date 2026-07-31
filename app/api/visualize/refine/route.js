const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `Kamu bantu nyederhanain tampilan visualisasi step-through kode buat pemula (siswa SMK/CS pemula yang lagi belajar array & loop). Tugasmu CUMA mutusin array mana yang perlu diringkas jadi sliding window dan seberapa lebar window-nya, plus alasan singkat yang gampang dimengerti. Kamu TIDAK menghitung posisi/koordinat, TIDAK mengubah data eksekusi, dan TIDAK membahas hal lain di luar itu.

Balas HANYA JSON valid, tanpa markdown/code fence, persis bentuk ini:
{
  "summary": "satu kalimat pendek kenapa tampilannya disederhanakan",
  "arrays": {
    "<namaVariabel>": {
      "collapse": true,
      "windowSize": 12,
      "reason": "kenapa array ini di-collapse (atau dibiarkan penuh), singkat"
    }
  }
}

windowSize harus bilangan bulat 4–30. Cuma sertakan nama array yang ada di daftar yang dikasih user.`;

function buildPrompt({ stepCount, threshold, arrays, code }) {
  const arrayList = arrays
    .map((array) => `- ${array.name}: sampai ${array.maxLength} elemen sepanjang eksekusi`)
    .join("\n");

  return [
    `Trace ini ${stepCount} langkah. Batas default sebelum array dianggap "besar" adalah ${threshold} elemen.`,
    `Array yang melewati batas itu:\n${arrayList}`,
    code ? `Kode yang dijalankan:\n\`\`\`js\n${code}\n\`\`\`` : "",
    "Putuskan array mana yang tetap perlu di-collapse jadi sliding window biar gampang diikuti pemula, dan window berapa elemen yang paling masuk akal per array (boleh beda-beda). Kalau menurutmu suatu array masih cukup jelas ditampilkan penuh, set collapse ke false.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Jangan pernah percaya JSON dari model mentah-mentah — saring ke bentuk yang cuma berisi keputusan, bukan koordinat. */
function sanitizeDecision(raw, knownNames) {
  if (!raw || typeof raw !== "object") return null;
  const known = new Set(knownNames);
  const arrays = {};

  if (raw.arrays && typeof raw.arrays === "object") {
    for (const [name, hint] of Object.entries(raw.arrays)) {
      if (!known.has(name) || !hint || typeof hint !== "object") continue;
      arrays[name] = {
        collapse: typeof hint.collapse === "boolean" ? hint.collapse : true,
        windowSize: clampInt(hint.windowSize, 4, 30, 12),
        reason: typeof hint.reason === "string" ? hint.reason.slice(0, 160) : "",
      };
    }
  }

  if (Object.keys(arrays).length === 0) return null;

  return {
    summary: typeof raw.summary === "string" ? raw.summary.slice(0, 240) : "",
    arrays,
  };
}

/** Reasoning pass Fase 2: ringkasan trace masuk, hint layout (bukan trace/koordinat) keluar. */
export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY belum diisi di .env — tampilan tetap pakai versi rule-based." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body-nya bukan JSON." }, { status: 400 });
  }

  const stepCount = Number.isInteger(body?.stepCount) ? body.stepCount : 0;
  const threshold = Number.isInteger(body?.threshold) ? body.threshold : 15;
  const arrays = Array.isArray(body?.arrays)
    ? body.arrays.filter(
        (item) => item && typeof item.name === "string" && Number.isFinite(item.maxLength),
      )
    : [];
  const code = typeof body?.code === "string" ? body.code.slice(0, 4000) : "";

  if (arrays.length === 0) {
    return Response.json({ error: "Gak ada array yang perlu disederhanakan." }, { status: 400 });
  }

  const prompt = buildPrompt({ stepCount, threshold, arrays, code });

  let groqRes;
  try {
    groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return Response.json({ error: "Gagal menghubungi Groq API." }, { status: 502 });
  }

  if (!groqRes.ok) {
    return Response.json({ error: "Groq API gagal merespons." }, { status: 502 });
  }

  let data;
  try {
    data = await groqRes.json();
  } catch {
    return Response.json({ error: "Respons Groq bukan JSON." }, { status: 502 });
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    return Response.json({ error: "Respons Groq kosong." }, { status: 502 });
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return Response.json({ error: "Respons Groq bukan JSON yang valid." }, { status: 502 });
  }

  const decision = sanitizeDecision(
    raw,
    arrays.map((item) => item.name),
  );
  if (!decision) {
    return Response.json({ error: "Respons Groq gak punya hint array yang valid." }, { status: 502 });
  }

  return Response.json({ decision });
}
