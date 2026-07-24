"use client";

function Chip({ children, tone = "plain" }) {
  const tones = {
    plain: "border-border bg-surface text-text-1",
    accent: "border-accent/35 bg-accent-soft text-accent font-semibold",
    error: "border-error/35 bg-error-soft text-error font-semibold",
    worked: "border-worked/35 bg-worked-soft text-worked font-semibold",
  };
  return (
    <span
      className={`no-liga rounded-[7px] border px-2 py-1 font-mono text-[13px] whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="w-20 shrink-0 text-[10px] font-semibold tracking-wider text-text-2 uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

const Arrow = () => (
  <span aria-hidden className="text-text-2">
    →
  </span>
);

function formatValue(value) {
  if (typeof value === "string") return `"${value}"`;
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  return String(value);
}

/**
 * Menjabarkan apa yang lagi disentuh baris ini, langkah demi langkah:
 * `arr[i]` → `arr[3]` → `22`. Ini rantai substitusi yang biasanya cuma ada di
 * kepala pengajar — di sini dibikin kelihatan biar bisa ditunjuk pas ngejelasin.
 */
export default function AccessStrip({ access }) {
  const { reads, calls, lengths } = access;
  if (reads.length === 0 && calls.length === 0 && lengths.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-app border border-border bg-surface px-4 py-3">
      {reads.map((read) => (
        <Row key={`${read.name}-${read.index}-${read.source}`} label="Dibaca">
          <Chip>{read.source}</Chip>
          {read.detail && (
            <>
              <Arrow />
              <Chip>{read.detail}</Chip>
            </>
          )}
          <Arrow />
          <Chip tone={read.inRange ? "accent" : "error"}>
            {read.name}[{read.index}]
          </Chip>
          <Arrow />
          {read.inRange ? (
            <Chip tone="accent">{formatValue(read.value)}</Chip>
          ) : (
            <Chip tone="error">undefined · di luar jangkauan</Chip>
          )}
        </Row>
      ))}

      {calls.map((call) => (
        <Row key={`${call.name}-${call.method}`} label="Diubah">
          <Chip>
            {call.name}.{call.method}()
          </Chip>
          <Arrow />
          <Chip tone="worked">
            {call.name} {call.verb}
          </Chip>
          {call.method === "push" && (
            <span className="font-mono text-xs text-text-2">
              masuk ke kotak {call.nextIndex}
            </span>
          )}
        </Row>
      ))}

      {lengths.map((item) => (
        <Row key={`len-${item.name}`} label="Panjang">
          <Chip>{item.name}.length</Chip>
          <Arrow />
          <Chip tone="accent">{item.value}</Chip>
          <span className="text-xs text-text-2">
            indeks terakhir {item.value - 1}
          </span>
        </Row>
      ))}
    </div>
  );
}
