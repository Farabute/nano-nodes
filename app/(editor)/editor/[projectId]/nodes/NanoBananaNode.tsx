"use client";

import React, { useMemo, useState } from "react";
import { Handle, Position, useReactFlow } from "reactflow";

type Img = { url: string; name?: string };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function NanoBananaNode({ id, data }: any) {
  const { setNodes } = useReactFlow();

  const images: Img[] = data?.images ?? [];
  const activeIndex: number = data?.activeIndex ?? 0;

  const [hover, setHover] = useState(false);

  const current = images[activeIndex];

  const setData = (patch: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  };

  const onPrev = () => {
    if (images.length === 0) return;
    setData({ activeIndex: clamp(activeIndex - 1, 0, images.length - 1) });
  };

  const onNext = () => {
    if (images.length === 0) return;
    setData({ activeIndex: clamp(activeIndex + 1, 0, images.length - 1) });
  };

  const onRun = () => {
    // Por ahora: simula “resultado”
    const fake: Img = {
      url: "/brand/nodes-placeholder.png", // lo creamos abajo
      name: `result-${images.length + 1}.png`,
    };
    const next = images.concat(fake);
    setData({ images: next, activeIndex: next.length - 1 });
  };

  const title = useMemo(
    () => data?.title ?? "Nano Banana Pro",
    [data?.title]
  );

  return (
    <div
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium text-zinc-100">{title}</div>
        <div className="text-xs text-zinc-500">⋯</div>
      </div>

      <div className="px-4 pb-4">
        <div className="relative aspect-[4/3] rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
          {current?.url ? (
            <img
              src={current.url}
              alt={current.name ?? "result"}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Sin resultados todavía
            </div>
          )}

          {images.length > 0 && (
            <>
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2 py-1 text-xs text-zinc-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  className="px-2 py-1 hover:bg-zinc-900/60 rounded-md"
                  title="Anterior"
                >
                  ←
                </button>
                <span className="tabular-nums">
                  {activeIndex + 1}/{images.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="px-2 py-1 hover:bg-zinc-900/60 rounded-md"
                  title="Siguiente"
                >
                  →
                </button>
              </div>

              {hover && current?.url && (
                <div className="absolute right-3 top-3 flex gap-2">
                  <a
                    href={current.url}
                    download={current.name ?? "result.png"}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download
                  </a>
                  <a
                    href={current.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Full
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => {
              // por ahora solo UI
              alert("Más inputs de imagen (UI por ahora).");
            }}
          >
            + Add another image input
          </button>

          <button
            type="button"
            className="rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-white"
            onClick={onRun}
          >
            Run
          </button>
        </div>
      </div>

      {/* inputs */}
      <Handle
        type="target"
        position={Position.Left}
        id="prompt"
        style={{
          top: 70,
          background: "#f59e0b",
          border: "2px solid #111827",
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        style={{
          top: 110,
          background: "#22c55e",
          border: "2px solid #111827",
          width: 12,
          height: 12,
        }}
      />

      {/* output result */}
      <Handle
        type="source"
        position={Position.Right}
        id="result"
        style={{
          background: "#2dd4bf",
          border: "2px solid #111827",
          width: 12,
          height: 12,
        }}
      />
    </div>
  );
}