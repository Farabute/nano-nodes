"use client";

import React from "react";

export type EditorBottomBarApi = {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export default function EditorBottomBar({
  apiRef,
}: {
  apiRef: React.MutableRefObject<EditorBottomBarApi | null>;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-200 shadow-lg">
        <button
          type="button"
          onClick={() => apiRef.current?.fit?.()}
          className="rounded-lg px-3 py-1 text-sm hover:bg-zinc-900/60"
          title="Fit"
        >
          Fit
        </button>

        <div className="h-5 w-px bg-zinc-800" />

        <button
          type="button"
          onClick={() => apiRef.current?.zoomOut?.()}
          className="rounded-lg px-3 py-1 text-sm hover:bg-zinc-900/60"
          title="Zoom out"
        >
          −
        </button>

        <button
          type="button"
          onClick={() => apiRef.current?.zoomIn?.()}
          className="rounded-lg px-3 py-1 text-sm hover:bg-zinc-900/60"
          title="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}