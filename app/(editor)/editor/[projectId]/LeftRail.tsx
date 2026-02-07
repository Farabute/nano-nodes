"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditorUI } from "./EditorUIContext";
import { useRouter } from "next/navigation";

export default function LeftRail() {
  const { openCreateMenu } = useEditorUI();
  const router = useRouter();

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);

  const menuPos = useMemo(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return { left: 0, top: 0 };
    return { left: r.right + 10, top: r.top };
  }, [open]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;

      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;

      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <aside className="relative z-50 flex h-[74vh] w-14 flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-black/60 py-3">
        {/* LOGO */}
        <button
          ref={btnRef}
          type="button"
          className="mt-1 rounded-xl p-2 hover:bg-zinc-900/60"
          title="Piko Nodes"
          onClick={() => setOpen((v) => !v)}
        >
          <img
            src="/brand/piko-nodes-logo-256.webp"
            alt="Piko Nodes"
            className="h-7 w-7"
            draggable={false}
          />
        </button>

        <div className="my-1 h-px w-9 bg-zinc-800" />

        {/* SEARCH */}
        <button
          type="button"
          className="rounded-xl p-2 text-zinc-200 hover:bg-zinc-900/60"
          title="Search"
          onClick={() => alert("Search panel próximamente")}
        >
          {/* lupa */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16.5 16.5 21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* NODES */}
        <button
          type="button"
          className="rounded-xl p-2 text-zinc-200 hover:bg-zinc-900/60"
          title="Create Node"
          onClick={() => openCreateMenu?.()}
        >
          {/* nodos */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 7h4v4H7V7Zm6 6h4v4h-4v-4ZM7 13h4v4H7v-4Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M11 9h2m-4 6h4m-2-4v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mt-auto" />
      </aside>

      {/* MENÚ LOGO (FIXED, no se corta por overflow) */}
      {open && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
          style={{ left: menuPos.left, top: menuPos.top }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => router.push("/app")}
          >
            ← Volver
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => router.push("/app")}
          >
            Salir del proyecto
          </button>
        </div>
      )}
    </>
  );
}