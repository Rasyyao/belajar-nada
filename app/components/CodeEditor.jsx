"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Monaco cuma bisa hidup di browser, jadi prerender-nya dimatikan.
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-code-bg font-mono text-sm text-code-text/60">
      Menyiapkan editor…
    </div>
  ),
});

const EDITOR_OPTIONS = {
  fontSize: 14,
  lineHeight: 23,
  fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
  fontLigatures: false,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 16, bottom: 16 },
  renderLineHighlight: "none",
  smoothScrolling: true,
  tabSize: 2,
  overviewRulerLanes: 0,
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
};

export default function CodeEditor({
  value,
  onChange,
  activeLine,
  onRun,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Monaco nangkep keyboard-nya sendiri, jadi Cmd/Ctrl+Enter perlu didaftarkan
  // ke editor-nya langsung. Lewat ref biar selalu manggil handler terbaru.
  const runRef = useRef(onRun);
  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!ready || !editor || !monaco) return;

    if (!decorationsRef.current) {
      decorationsRef.current = editor.createDecorationsCollection([]);
    }

    if (!activeLine) {
      decorationsRef.current.set([]);
      return;
    }

    decorationsRef.current.set([
      {
        range: new monaco.Range(activeLine, 1, activeLine, 1),
        options: {
          isWholeLine: true,
          className: "viz-active-line",
          linesDecorationsClassName: "viz-active-gutter",
        },
      },
    ]);
    editor.revealLineInCenterIfOutsideViewport(activeLine);
  }, [activeLine, ready]);

  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      theme="vs-dark"
      value={value}
      onChange={(next) => onChange(next ?? "")}
      options={{ ...EDITOR_OPTIONS, readOnly }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          runRef.current?.();
        });
        setReady(true);
      }}
    />
  );
}
