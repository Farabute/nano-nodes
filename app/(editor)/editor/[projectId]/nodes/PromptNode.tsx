"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow, useStore } from "reactflow";
import NodeShell from "./NodeShell";

export default function PromptNode({ id, data, selected }: any) {
  const { setNodes } = useReactFlow();

  const [value, setValue] = useState<string>(data?.text ?? "");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // mantener input synced si cambia desde afuera
  useEffect(() => {
    setValue(data?.text ?? "");
  }, [data?.text]);

  const resize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 260);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 260 ? "auto" : "hidden";
  }, []);

  const onChange = useCallback(
    (v: string) => {
      setValue(v);
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n))
      );
      requestAnimationFrame(resize);
    },
    [id, resize, setNodes]
  );

  const title = useMemo(() => data?.title ?? "Prompt", [data?.title]);

  // ===== Handle “bolita”: detectar si está conectado =====
  // usamos un handleId estable
  const OUT_HANDLE = "out";

  const isConnected = useStore(
    useCallback(
      (s: any) =>
        (s.edges as any[]).some((e) => e.source === id && (e.sourceHandle ?? null) === OUT_HANDLE),
      [id]
    )
  );

  const color = "#f59e0b"; // naranja prompt
  const ringBg = selected ? "#3f3f46" : "#2b2b30"; 
  const HANDLE_SIZE = 10;

  // bolita: aro + centro (centro prende si conectado)
  const handleStyle: React.CSSProperties = useMemo(() => {
    // radial-gradient para el puntito del medio
    const dot = isConnected
      ? `radial-gradient(circle at center, ${color} 0 3px, ${ringBg} 4px 100%)`
      : `radial-gradient(circle at center, ${ringBg} 0 3px, ${ringBg} 4px 100%)`;

    return {
      width: 20,
      height: 20,
      borderRadius: 999,
      backgroundImage: dot,
      border: `3px solid ${color}`, // aro de color
      marginRight: -HANDLE_SIZE / 2,
      boxShadow: `0 0 0 6px ${ringBg}`, // aro gris externo
    };
  }, [isConnected, color, ringBg]);

  return (
    <NodeShell id={id} title={title} canEdit selected={selected}>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={resize}
        placeholder="Escribí tu prompt…"
        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-700"
        style={{ height: 120, maxHeight: 260, overflowY: "auto" }}
      />

      {/* salida derecha */}
      <Handle
        id={OUT_HANDLE}
        type="source"
        position={Position.Right}
        style={handleStyle}
      />
    </NodeShell>
  );
}