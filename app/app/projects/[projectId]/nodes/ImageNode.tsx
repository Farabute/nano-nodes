"use client";

import React, { useMemo, useState } from "react";
import { Handle, Position } from "reactflow";

type Img = { url: string; name?: string };

export default function ImageNode({ data }: any) {
  const imgs: Img[] = data?.images ?? [];
  const img = imgs[0];

  const [hover, setHover] = useState(false);

  const src = useMemo(() => img?.url ?? "", [img?.url]);

  return (
    <div
      className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium text-zinc-100">
          {data?.title ?? "Image"}
        </div>
        <div className="text-xs text-zinc-500">⋯</div>
      </div>

      <div className="relative aspect-square bg-zinc-950/40">
        {src ? (
          <img
            src={src}
            alt={img?.name ?? "image"}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500">
            Sin imagen
          </div>
        )}

        {src && hover && (
          <div className="absolute right-3 top-3 flex gap-2">
            <a
              href={src}
              download={img?.name ?? "image.png"}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              onClick={(e) => e.stopPropagation()}
            >
              Full
            </a>
          </div>
        )}
      </div>

      {/* salida verde agua */}
      <Handle
        type="source"
        position={Position.Right}
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