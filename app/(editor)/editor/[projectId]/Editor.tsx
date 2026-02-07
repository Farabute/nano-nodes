"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  useEdgesState,
  useNodesState,
  Connection,
  addEdge,
  ReactFlowProvider,
  MarkerType,
  Node as RFNode,
  Edge as RFEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import PromptNode from "./nodes/PromptNode";
import ImageNode from "./nodes/ImageNode";
import NanoBananaNode from "./nodes/NanoBananaNode";

import LeftRail from "./LeftRail";
import { EditorUIContext } from "./EditorUIContext";

type EditorProps = {
  projectId: string;
  projectName: string;
  canEdit: boolean;
  initialNodes: any[];
  initialEdges: any[];
  initialTitle?: string;
};

type MenuKind = "prompt" | "image" | "nano";

function InnerEditor({
  projectId,
  canEdit,
  initialNodes,
  initialEdges,
  initialTitle,
}: EditorProps) {
  // ✅ wrapperRef SOLO del canvas (para calcular coords)
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode[]>(
    (initialNodes as RFNode[]) ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>(
    (initialEdges as RFEdge[]) ?? []
  );

  const nodeTypes = useMemo(
    () => ({
      prompt: PromptNode,
      image: ImageNode,
      nano: NanoBananaNode,
    }),
    []
  );

  const [rfInstance, setRfInstance] = useState<any>(null);

  // ===== TITLE =====
  const [title, setTitle] = useState(initialTitle ?? "Untitled Project");

  // ===== CREATE MENU =====
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number }>({
    open: false,
    x: 0,
    y: 0,
  });

  const [menuPosFlow, setMenuPosFlow] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const closeCreateMenu = useCallback(
    () => setMenu((m) => ({ ...m, open: false })),
    []
  );

  // ===== PERSISTENCIA =====
  const [hydrated, setHydrated] = useState(false);
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/graph`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        setNodes(Array.isArray(data?.nodes) ? data.nodes : []);
        setEdges(Array.isArray(data?.edges) ? data.edges : []);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [projectId, setNodes, setEdges]);

  const scheduleSave = useCallback(
    (nextNodes: RFNode[], nextEdges: RFEdge[]) => {
      if (!hydrated || !canEdit) return;

      if (saveTimer.current) window.clearTimeout(saveTimer.current);

      saveTimer.current = window.setTimeout(async () => {
        try {
          setSavingState("saving");
          const res = await fetch(`/api/projects/${projectId}/graph`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodes: nextNodes, edges: nextEdges }),
          });

          if (!res.ok) {
            setSavingState("error");
            return;
          }

          setSavingState("saved");
          window.setTimeout(() => setSavingState("idle"), 900);
        } catch {
          setSavingState("error");
        }
      }, 600);
    },
    [hydrated, canEdit, projectId]
  );

  useEffect(() => {
    if (!hydrated) return;
    scheduleSave(nodes, edges);
  }, [nodes, edges, hydrated, scheduleSave]);

  // ===== OPEN MENU API (para LeftRail externo) =====
  const openCreateMenu = useCallback(() => {
    if (!canEdit) return;
    if (!canvasRef.current || !rfInstance) return;

    const bounds = canvasRef.current.getBoundingClientRect();

    // coordenadas dentro del canvas
    const x = Math.round(bounds.width * 0.45);
    const y = Math.round(bounds.height * 0.35);

    const flowPoint = rfInstance.project({ x, y });

    setMenu({ open: true, x, y });
    setMenuPosFlow(flowPoint);
  }, [canEdit, rfInstance]);

  const openContextMenuAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!canEdit) return;
      if (!canvasRef.current || !rfInstance) return;

      const bounds = canvasRef.current.getBoundingClientRect();
      const xInCanvas = clientX - bounds.left;
      const yInCanvas = clientY - bounds.top;

      const flowPoint = rfInstance.project({ x: xInCanvas, y: yInCanvas });

      setMenu({ open: true, x: xInCanvas, y: yInCanvas });
      setMenuPosFlow(flowPoint);
    },
    [canEdit, rfInstance]
  );

  // click afuera / escape cierra menú
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menu.open) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (createMenuRef.current && createMenuRef.current.contains(t)) return;
      closeCreateMenu();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCreateMenu();
      if (e.key === "Tab") {
        e.preventDefault();
        openCreateMenu();
      }
    }

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu.open, closeCreateMenu, openCreateMenu]);

  const createNode = useCallback(
    (kind: MenuKind) => {
      if (!canEdit) return;

      const id = `${kind}-${crypto.randomUUID()}`;

      const base: RFNode = {
        id,
        position: { ...menuPosFlow },
        type: kind,
        data: {},
      };

      const node: RFNode =
        kind === "prompt"
          ? {
              ...base,
              data: { title: "Prompt", text: "" },
              style: { width: 360 },
            }
          : kind === "image"
          ? {
              ...base,
              data: { title: "Image", images: [], activeIndex: 0 },
              style: { width: 320 },
            }
          : {
              ...base,
              data: {
                title: "Nano Banana Pro",
                images: [],
                activeIndex: 0,
                resolution: "1K",
                aspect: "4:3",
              },
              style: { width: 420 },
            };

      setNodes((ns) => ns.concat(node));
      closeCreateMenu();
    },
    [canEdit, menuPosFlow, setNodes, closeCreateMenu]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!canEdit) return;
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [canEdit, setEdges]
  );

  // ===== ZOOM =====
  const zoomIn = () => rfInstance?.zoomIn?.();
  const zoomOut = () => rfInstance?.zoomOut?.();
  const fit = () => rfInstance?.fitView?.({ padding: 0.2 });

  return (
    <EditorUIContext.Provider value={{ openCreateMenu }}>
      {/* ✅ Layout: rail externo + canvas */}
      <div className="flex h-[74vh] gap-4">
        <LeftRail />

        {/* ✅ Canvas (overflow-hidden SOLO acá) */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-black"
        >
          {/* TITLE INSIDE canvas */}
          <div className="absolute left-4 top-3 z-40 flex items-center gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-[340px] rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
              placeholder="Nombre del proyecto"
            />
            <div className="text-xs text-zinc-400">
              {canEdit
                ? savingState === "saving"
                  ? "Guardando…"
                  : savingState === "saved"
                  ? "Guardado"
                  : savingState === "error"
                  ? "Error"
                  : "Listo"
                : "Solo lectura"}
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            onNodesChange={canEdit ? onNodesChange : undefined}
            onEdgesChange={canEdit ? onEdgesChange : undefined}
            onConnect={onConnect}
            onPaneContextMenu={(e) => {
              e.preventDefault();
              openContextMenuAt(e.clientX, e.clientY);
            }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={18} size={1} />
          </ReactFlow>

          {/* CREATE MENU */}
          {menu.open && (
            <div
              ref={createMenuRef}
              className="absolute z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
              style={{ left: menu.x, top: menu.y }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900/60"
                onClick={() => createNode("prompt")}
              >
                Prompt
              </button>
              <button
                className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900/60"
                onClick={() => createNode("image")}
              >
                Image
              </button>
              <button
                className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900/60"
                onClick={() => createNode("nano")}
              >
                Nano Banana Pro
              </button>
            </div>
          )}

          {/* BOTTOM CONTROLS */}
          <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2">
            <div className="flex gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-200">
              <button onClick={fit} className="px-2 hover:text-white">
                Fit
              </button>
              <button onClick={zoomOut} className="px-2 hover:text-white">
                −
              </button>
              <button onClick={zoomIn} className="px-2 hover:text-white">
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </EditorUIContext.Provider>
  );
}

export default function Editor(props: EditorProps) {
  return (
    <ReactFlowProvider>
      <InnerEditor {...props} />
    </ReactFlowProvider>
  );
}