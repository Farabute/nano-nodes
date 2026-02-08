"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow, useStore } from "reactflow";
import NodeShell from "./NodeShell";

type FileItem = {
  url: string;
  name: string;
  type: string; // mime
};

function guessKind(mime: string): "image" | "video" | "audio" | "unknown" {
  if (!mime) return "unknown";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "unknown";
}

export default function FileNode({ id, data, selected }: any) {
  const { setNodes } = useReactFlow();

  const files: FileItem[] = Array.isArray(data?.files) ? data.files : [];
  const activeIndex: number = typeof data?.activeIndex === "number" ? data.activeIndex : 0;
  const active = files[activeIndex] ?? null;

  const title = useMemo(() => data?.title ?? "File", [data?.title]);

  // ===== Handles (conectado / no conectado) =====
  const IN_HANDLE = "in";
  const OUT_HANDLE = "out";

  const isInConnected = useStore(
    useCallback(
      (s: any) =>
        (s.edges as any[]).some(
          (e) => e.target === id && (e.targetHandle ?? null) === IN_HANDLE
        ),
      [id]
    )
  );

  const isOutConnected = useStore(
    useCallback(
      (s: any) =>
        (s.edges as any[]).some(
          (e) => e.source === id && (e.sourceHandle ?? null) === OUT_HANDLE
        ),
      [id]
    )
  );

  // Color del nodo file (podés cambiarlo después)
  const color = "#22c55e"; // verde
  const ringBg = "#09090b"; // similar a zinc-950 (para aro exterior)
  const halo = selected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)";

  const handleStyle = useCallback(
    (connected: boolean): React.CSSProperties => {
      const dot = connected
        ? `radial-gradient(circle at center, ${color} 0 3px, ${ringBg} 4px 100%)`
        : `radial-gradient(circle at center, ${ringBg} 0 3px, ${ringBg} 4px 100%)`;

      return {
        width: 20,
        height: 20,
        borderRadius: 999,
        backgroundImage: dot,
        border: `3px solid ${color}`,
        boxShadow: `0 0 0 6px ${ringBg}, 0 0 0 1px ${halo}`,
      };
    },
    [color, ringBg, halo]
  );

  // Los movemos “más afuera” del nodo
  const inStyle = useMemo(
    () => ({ ...handleStyle(isInConnected), marginLeft: -10 }),
    [handleStyle, isInConnected]
  );
  const outStyle = useMemo(
    () => ({ ...handleStyle(isOutConnected), marginRight: -10 }),
    [handleStyle, isOutConnected]
  );

  // ===== Helpers para setear data =====
  const setData = useCallback(
    (patch: any) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...(n.data as any), ...patch } } : n))
      );
    },
    [id, setNodes]
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) return;

      const mapped: FileItem[] = incoming.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
        type: f.type || "application/octet-stream",
      }));

      const nextFiles = files.concat(mapped);
      setData({
        files: nextFiles,
        activeIndex: nextFiles.length - 1,
      });
    },
    [files, setData]
  );

  // ===== Drag&drop dentro del nodo =====
  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    function onDragOver(e: DragEvent) {
      e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      const list = Array.from(e.dataTransfer?.files ?? []);
      if (!list.length) return;

      // Permitimos image/video/audio
      const allowed = list.filter(
        (f) =>
          f.type.startsWith("image/") || f.type.startsWith("video/") || f.type.startsWith("audio/")
      );
      addFiles(allowed);
    }

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, [addFiles]);

  // ===== File picker =====
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const kind = active ? guessKind(active.type) : "unknown";

  return (
    <NodeShell id={id} title={title} canEdit selected={selected}>
      <div className="space-y-3">
        <div
          ref={dropRef}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200"
        >
          {!active ? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-400">
                Arrastrá un <span className="text-zinc-200">video / audio / imagen</span> acá
              </div>
              <button
                type="button"
                onClick={openPicker}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800"
              >
                Importar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-zinc-200">{active.name}</div>
                <button
                  type="button"
                  onClick={openPicker}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800"
                >
                  Reemplazar / agregar
                </button>
              </div>

              {kind === "image" ? (
                <img
                  src={active.url}
                  alt={active.name}
                  className="h-44 w-full rounded-lg object-contain bg-black"
                  draggable={false}
                />
              ) : kind === "video" ? (
                <video
                  src={active.url}
                  controls
                  className="h-44 w-full rounded-lg bg-black"
                />
              ) : kind === "audio" ? (
                <audio src={active.url} controls className="w-full" />
              ) : (
                <div className="rounded-lg border border-zinc-800 bg-black p-3 text-zinc-400">
                  Tipo no soportado: {active.type}
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              if (list.length) addFiles(list);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {files.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-500">Files</div>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <button
                  key={f.url}
                  type="button"
                  onClick={() => setData({ activeIndex: i })}
                  className={[
                    "max-w-[220px] truncate rounded-lg border px-2 py-1 text-xs",
                    i === activeIndex
                      ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900",
                  ].join(" ")}
                  title={f.name}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle id={IN_HANDLE} type="target" position={Position.Left} style={inStyle} />
      <Handle id={OUT_HANDLE} type="source" position={Position.Right} style={outStyle} />
    </NodeShell>
  );
}