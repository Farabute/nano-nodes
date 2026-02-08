"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid } from "lucide-react";
import { useEditorUI } from "./EditorUIContext";

export default function LeftRail() {
  const router = useRouter();
  const { openCreateMenu } = useEditorUI();

  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement | null>(null);

  const [nodesMenuOpen, setNodesMenuOpen] = useState(false);
  const nodesMenuRef = useRef<HTMLDivElement | null>(null);

  // click afuera cierra menús
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;

      if (
        logoMenuOpen &&
        logoMenuRef.current &&
        !logoMenuRef.current.contains(t)
      ) {
        setLogoMenuOpen(false);
      }

      if (
        nodesMenuOpen &&
        nodesMenuRef.current &&
        !nodesMenuRef.current.contains(t)
      ) {
        setNodesMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [logoMenuOpen, nodesMenuOpen]);

  return (
    <aside className="flex h-full w-14 flex-col items-center bg-zinc-900 py-3">
      {/* LOGO + MENU */}
      <div className="relative mt-1">
        <button
          type="button"
          className="rounded-xl p-2 hover:bg-zinc-900/60"
          title="Piko Nodes"
          onClick={() => {
            setLogoMenuOpen((v) => !v);
            setNodesMenuOpen(false);
          }}
        >
          <img
            src="/brand/piko-nodes-logo-256.webp"
            alt="Piko Nodes"
            className="h-7 w-7"
            draggable={false}
          />
        </button>

        {logoMenuOpen && (
          <div
            ref={logoMenuRef}
            className="absolute left-12 top-0 z-[999] w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
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
      </div>

      <div className="my-1 h-px w-9 bg-zinc-800" />

      {/* SEARCH (placeholder) */}
      <button
        type="button"
        className="rounded-xl p-2 text-zinc-200 hover:bg-zinc-900/60"
        title="Search"
        onClick={() => alert("Search panel próximamente")}
      >
        <Search size={20} />
      </button>

      {/* NODES MENU (submenu) */}
      <div className="relative">
        <button
          type="button"
          className="rounded-xl p-2 text-zinc-200 hover:bg-zinc-900/60"
          title="Create Node"
          onClick={() => {
            setNodesMenuOpen((v) => !v);
            setLogoMenuOpen(false);
          }}
        >
          <LayoutGrid size={20} />
        </button>

        {nodesMenuOpen && (
          <div
            ref={nodesMenuRef}
            className="absolute left-12 top-0 z-[999] w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
              Crear nodo
            </div>

            {/* Por ahora: abre el menú del canvas (mismo que TAB / click derecho). */}
            <button
              className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
              onClick={() => {
                openCreateMenu();
                setNodesMenuOpen(false);
              }}
            >
              Prompt
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
              onClick={() => {
                openCreateMenu();
                setNodesMenuOpen(false);
              }}
            >
              Image
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
              onClick={() => {
                openCreateMenu();
                setNodesMenuOpen(false);
              }}
            >
              Nano Banana Pro
            </button>

            <div className="px-3 py-2 text-xs text-zinc-500">
              (Luego hacemos que cada item cree el nodo directo.)
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto" />
    </aside>
  );
}