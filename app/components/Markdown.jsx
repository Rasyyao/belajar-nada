import ReactMarkdown from "react-markdown";

/**
 * Render markdown materi.
 *
 * Tiap tag dipetakan manual ke utility class, bukan diserahin ke plugin
 * typography: konten materi bakal dibaca bareng panel-panel lain di aplikasi
 * ini, jadi ukuran teks dan jaraknya dibikin sama kayak sisanya.
 *
 * `react-markdown` gak ngizinin HTML mentah secara default, jadi konten yang
 * diketik di halaman admin gak bisa nyelipin <script> ke halaman siswa.
 */

const components = {
  h1: (props) => (
    <h1 className="mt-6 mb-2 font-heading text-2xl text-text-1 first:mt-0" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-6 mb-2 font-heading text-xl text-text-1 first:mt-0" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-5 mb-1.5 font-heading text-lg text-text-1 first:mt-0" {...props} />
  ),
  p: (props) => (
    <p className="my-3 text-[14px] leading-relaxed text-text-1" {...props} />
  ),
  ul: (props) => (
    <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-relaxed text-text-1" {...props} />
  ),
  ol: (props) => (
    <ol className="my-3 flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-relaxed text-text-1" {...props} />
  ),
  a: (props) => (
    <a
      className="font-semibold text-accent underline underline-offset-2"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-3 border-l-2 border-accent/40 bg-accent-soft/40 px-4 py-2 text-[13.5px] leading-relaxed text-text-1"
      {...props}
    />
  ),
  // Blok kode dibungkus <pre>, kode inline enggak — bedanya dipakai buat milih
  // gaya: gelap dan lebar penuh, atau chip kecil di tengah kalimat.
  code: ({ children, ...props }) => (
    <code
      className="no-liga rounded-[6px] bg-bg px-1.5 py-0.5 font-mono text-[12.5px] text-worked"
      {...props}
    >
      {children}
    </code>
  ),
  pre: (props) => (
    <pre
      className="no-liga my-3 overflow-x-auto rounded-app bg-code-bg px-4 py-3 font-mono text-[12.5px] leading-relaxed text-code-text [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-code-text"
      {...props}
    />
  ),
  hr: () => <hr className="my-6 border-border" />,
  table: (props) => (
    <div className="thin-scroll my-3 overflow-x-auto">
      <table className="w-full text-left text-[13px]" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b border-border pb-1.5 text-[11px] font-semibold tracking-wider text-text-2 uppercase" {...props} />
  ),
  td: (props) => <td className="border-t border-border py-1.5 pr-3" {...props} />,
  strong: (props) => <strong className="font-semibold text-text-1" {...props} />,
};

export default function Markdown({ children }) {
  if (!children) return null;
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
