"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  useEdgesState,
  useNodesState,
  Connection,
  addEdge,
  MarkerType,
  Node as RFNode,
  Edge as RFEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import PromptNode from "../nodes/PromptNode";
import FileNode from "../nodes/FileNode";
import NanoBananaNode from "../nodes/NanoBananaNode";
import type { EditorBottomBarApi } from "./EditorBottomBar";

type MenuKind = "prompt" | "file" | "nano";

export type EditorCanvasProps = {
  projectId: string;
  canEdit: boolean;
  initialNodes: any[];
  initialEdges: any[];
  initialTitle?: string;

  openCreateMenuRef: React.MutableRefObject<(() => void) | null>;

  pendingOpenCreateMenu: boolean;
  clearPendingOpenCreateMenu: () => void;

  bottomBarApiRef: React.MutableRefObject<EditorBottomBarApi | null>;
};

export default function EditorCanvas({
  projectId,
  canEdit,
  initialNodes,
  initialEdges,
  initialTitle,
  openCreateMenuRef,
  pendingOpenCreateMenu,
  clearPendingOpenCreateMenu,
  bottomBarApiRef,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode[]>(
    (initialNodes as RFNode[]) ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>(
    (initialEdges as RFEdge[]) ?? []
  );

  const nodeTypes = useMemo(
    () => ({ prompt: PromptNode, file: FileNode, nano: NanoBananaNode }),
    []
  );

  const [rfInstance, setRfInstance] = useState<any>(null);

  // ===== TITLE (UI) =====
  const [title, setTitle] = useState(initialTitle ?? "Untitled Project");
  useEffect(() => {
    setTitle(initialTitle ?? "Untitled Project");
  }, [initialTitle]);

  const titleSaveTimer = useRef<number | null>(null);
  const titleInFlight = useRef<AbortController | null>(null);
  const [titleSaving, setTitleSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  
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

  const closeCreateMenu = useCallback(() => {
    setMenu((m) => ({ ...m, open: false }));
  }, []);

  // ===== PERSISTENCIA =====
  const [hydrated, setHydrated] = useState(false);
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const saveTimer = useRef<number | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  // LOAD desde DB
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setSavingState("idle");
        const res = await fetch(`/api/projects/${projectId}/graph`, { method: "GET" });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        const nextNodes = Array.isArray(data?.nodes) ? (data.nodes as RFNode[]) : [];
        const nextEdges = Array.isArray(data?.edges) ? (data.edges as RFEdge[]) : [];

        setNodes(nextNodes);
        setEdges(nextEdges);
      } catch {
        // si falla igual marcamos hydrated para no bloquear
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      inFlight.current?.abort();
    };
  }, [projectId, setNodes, setEdges]);

  const scheduleSave = useCallback(
    (nextNodes: RFNode[], nextEdges: RFEdge[]) => {
      if (!canEdit) return;
      if (!hydrated) return;

      if (saveTimer.current) window.clearTimeout(saveTimer.current);

      saveTimer.current = window.setTimeout(async () => {
        try {
          setSavingState("saving");

          inFlight.current?.abort();
          const controller = new AbortController();
          inFlight.current = controller;

          const res = await fetch(`/api/projects/${projectId}/graph`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodes: nextNodes, edges: nextEdges }),
            signal: controller.signal,
          });

          if (!res.ok) {
            setSavingState("error");
            return;
          }

          setSavingState("saved");
          window.setTimeout(() => setSavingState("idle"), 900);
        } catch (e: any) {
          if (e?.name === "AbortError") return;
          setSavingState("error");
        }
      }, 650);
    },
    [projectId, canEdit, hydrated]
  );

  // cuando cambian nodes/edges guardamos (debounce)
  useEffect(() => {
    if (!hydrated) return;
    scheduleSave(nodes, edges);
  }, [nodes, edges, hydrated, scheduleSave]);

  // ===== OPEN MENU API (para LeftRail) =====
  const openCreateMenu = useCallback(() => {
    if (!canEdit) return;
    if (!canvasRef.current || !rfInstance) return;

    const bounds = canvasRef.current.getBoundingClientRect();
    const x = Math.round(bounds.width * 0.45);
    const y = Math.round(bounds.height * 0.35);

    const flowPoint = rfInstance.project({ x, y });
    setMenu({ open: true, x, y });
    setMenuPosFlow(flowPoint);
  }, [canEdit, rfInstance]);

  // Exportamos la función al ref para que el rail la dispare
  useEffect(() => {
    openCreateMenuRef.current = openCreateMenu;
    return () => {
      openCreateMenuRef.current = null;
    };
  }, [openCreateMenu, openCreateMenuRef]);

  // Si el rail pidió abrir antes de que el canvas esté listo
  useEffect(() => {
    if (!pendingOpenCreateMenu) return;
    if (!rfInstance) return;
    openCreateMenu();
    clearPendingOpenCreateMenu();
  }, [pendingOpenCreateMenu, rfInstance, openCreateMenu, clearPendingOpenCreateMenu]);

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
          : kind === "file"
          ? {
              ...base,
              data: { title: "File", files: [], activeIndex: 0 },
              style: { width: 360 }, // ← unificado
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
        addEdge({ ...conn, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
      );
    },
    [canEdit, setEdges]
  );

  // ===== BottomBar API =====
  const fit = useCallback(() => rfInstance?.fitView?.({ padding: 0.2 }), [rfInstance]);
  const zoomIn = useCallback(() => rfInstance?.zoomIn?.(), [rfInstance]);
  const zoomOut = useCallback(() => rfInstance?.zoomOut?.(), [rfInstance]);

  useEffect(() => {
    bottomBarApiRef.current = { fit, zoomIn, zoomOut };
    return () => {
      bottomBarApiRef.current = null;
    };
  }, [bottomBarApiRef, fit, zoomIn, zoomOut]);

  useEffect(() => {
    if (!canEdit) return;

    // si todavía no vino initialTitle, evitamos primer guardado “Untitled…”
    if (!initialTitle) return;

    if (titleSaveTimer.current) window.clearTimeout(titleSaveTimer.current);

    titleSaveTimer.current = window.setTimeout(async () => {
      try {
        const next = (title ?? "").trim();
        if (!next) return;

        // si no cambió, no pegamos a la API
        if ((initialTitle ?? "").trim() === next) return;

        setTitleSaving("saving");

        titleInFlight.current?.abort();
        const controller = new AbortController();
        titleInFlight.current = controller;

        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: next }),
          signal: controller.signal,
        });

        if (!res.ok) {
          setTitleSaving("error");
          return;
        }

        setTitleSaving("saved");
        window.setTimeout(() => setTitleSaving("idle"), 900);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setTitleSaving("error");
      }
    }, 650);

    return () => {
      if (titleSaveTimer.current) window.clearTimeout(titleSaveTimer.current);
      titleInFlight.current?.abort();
    };
    // OJO: depende de projectId/title/canEdit/initialTitle
  }, [title, projectId, canEdit, initialTitle]);

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full min-h-0 overflow-hidden rounded-2xl border border-zinc-800 bg-black"
    >
      {/* TITLE INSIDE canvas */}
      <div className="absolute left-4 top-3 z-50 flex items-center gap-3 pointer-events-auto">
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
              ? "Error al guardar"
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
        style={{ width: "100%", height: "100%" }}
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
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
            Crear nodo
          </div>

          <button
            className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => createNode("prompt")}
          >
            Prompt
          </button>

          <button
            className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => createNode("file")}
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
    </div>
  );
}