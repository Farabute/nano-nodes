"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow } from "reactflow";

export default function PromptNode({ id, data }: any) {
  const { setNodes } = useReactFlow();
  const [value, setValue] = useState<string>(data?.text ?? "");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 260); // max visible height
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

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium text-zinc-100">{title}</div>
        <div className="text-xs text-zinc-500">⋯</div>
      </div>

      <div className="px-4 pb-4">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={resize}
          placeholder="Escribí tu prompt…"
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-700"
          style={{ height: 120, maxHeight: 260, overflowY: "auto" }}
        />
      </div>

      {/* salida naranja */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#f59e0b",
          border: "2px solid #111827",
          width: 12,
          height: 12,
        }}
      />
    </div>
  );
}