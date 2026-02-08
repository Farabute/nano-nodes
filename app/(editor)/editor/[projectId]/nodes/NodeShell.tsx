"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "reactflow";

type NodeShellProps = {
  id: string;
  title: string;
  children: React.ReactNode;

  headerRight?: React.ReactNode;
  canEdit?: boolean;

  // ✅ para estilo seleccionado (lo pasás desde cada Node component)
  selected?: boolean;
};

export default function NodeShell({
  id,
  title,
  children,
  headerRight,
  canEdit = true,
  selected = false,
}: NodeShellProps) {
  const { setNodes, setEdges, getNode } = useReactFlow();

  const [open, setOpen] = useState(false);

  // ✅ refs separados: botón y menú
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ====== Cerrar al click afuera + Escape ======
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node | null;
      if (!t) return;

      const inTrigger = triggerRef.current?.contains(t) ?? false;
      const inMenu = menuRef.current?.contains(t) ?? false;

      if (inTrigger || inMenu) return;
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ====== Cerrar si el mouse sale de trigger + menú ======
  useEffect(() => {
    if (!open) return;

    let timer: number | null = null;

    const closeSoon = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setOpen(false), 180);
    };

    const cancelClose = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const trig = triggerRef.current;
    const menu = menuRef.current;

    trig?.addEventListener("mouseleave", closeSoon);
    menu?.addEventListener("mouseleave", closeSoon);

    trig?.addEventListener("mouseenter", cancelClose);
    menu?.addEventListener("mouseenter", cancelClose);

    return () => {
      if (timer) window.clearTimeout(timer);
      trig?.removeEventListener("mouseleave", closeSoon);
      menu?.removeEventListener("mouseleave", closeSoon);
      trig?.removeEventListener("mouseenter", cancelClose);
      menu?.removeEventListener("mouseenter", cancelClose);
    };
  }, [open]);

  const shortcuts = useMemo(
    () => ({
      duplicate: navigator?.platform?.toLowerCase().includes("mac") ? "cmd+d" : "ctrl+d",
      delete: "delete / backspace",
    }),
    []
  );

  const doRename = () => {
    if (!canEdit) return;
    const node = getNode(id);
    const current = (node?.data as any)?.title ?? title;
    const next = window.prompt("Rename node", current);
    if (!next) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...(n.data as any), title: next } } : n
      )
    );
    setOpen(false);
  };

  const doDuplicate = () => {
    if (!canEdit) return;
    const node = getNode(id);
    if (!node) return;

    const newId = `${node.type ?? "node"}-${crypto.randomUUID()}`;
    const offset = { x: 36, y: 36 };

    setNodes((nds) =>
      nds.concat({
        ...node,
        id: newId,
        position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
        selected: false,
        dragging: false,
      } as any)
    );
    setOpen(false);
  };

  const doDelete = () => {
    if (!canEdit) return;
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setOpen(false);
  };

  return (
    <div
      className={[
        "rounded-2xl border transition-all duration-150",
        selected
            ? "bg-zinc-800 border-zinc-500 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_18px_rgba(255,255,255,0.05)]"
            : "bg-zinc-900 border-zinc-800 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
      ].join(" ")}
      style={{ transform: selected ? "translateY(-1px)" : undefined }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium text-zinc-100">{title}</div>

        <div className="flex items-center gap-2">
          {headerRight}

          {/* 3 dots + menu */}
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              className="rounded-lg px-2 py-1 text-zinc-300 hover:bg-zinc-800/60"
              onClick={() => setOpen((v) => !v)}
              title="Menu"
            >
              ⋯
            </button>

            {open && (
              <div
                ref={menuRef}
                // ✅ aparece corrido a la derecha del botón
                className="absolute left-full top-0 ml-2 z-[9999] w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-100 hover:bg-zinc-800/60"
                  onClick={doDuplicate}
                >
                  <span>Duplicate</span>
                  <span className="text-zinc-400">{shortcuts.duplicate}</span>
                </button>

                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-100 hover:bg-zinc-800/60"
                  onClick={doRename}
                >
                  <span>Rename</span>
                  <span />
                </button>

                <div className="h-px w-full bg-zinc-800" />

                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-100 hover:bg-zinc-800/60"
                  onClick={doDelete}
                >
                  <span>Delete</span>
                  <span className="text-zinc-400">{shortcuts.delete}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}