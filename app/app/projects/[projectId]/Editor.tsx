"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import PromptNode from "./nodes/PromptNode";
import ImageNode from "./nodes/ImageNode";
import NanoBananaNode from "./nodes/NanoBananaNode";

type EditorProps = {
  projectId: string;
  canEdit: boolean;
  initialNodes: any[];
  initialEdges: any[];
};

type MenuKind = "prompt" | "image" | "nano";

function InnerEditor({ projectId, canEdit, initialNodes, initialEdges }: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(
    (initialNodes as Node[]) ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(
    (initialEdges as Edge[]) ?? []
  );

  const nodeTypes = useMemo(
    () => ({
      prompt: PromptNode,
      image: ImageNode,
      nano: NanoBananaNode,
    }),
    []
  );

  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number }>({
    open: false,
    x: 0,
    y: 0,
  });

  const [menuPosFlow, setMenuPosFlow] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const [rfInstance, setRfInstance] = useState<any>(null);

  // ===== Persistencia =====
  const [hydrated, setHydrated] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<number | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));

  // LOAD desde DB
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setSavingState("idle");
        const res = await fetch(`/api/projects/${projectId}/graph`, { method: "GET" });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        const nextNodes = Array.isArray(data?.nodes) ? (data.nodes as Node[]) : [];
        const nextEdges = Array.isArray(data?.edges) ? (data.edges as Edge[]) : [];

        setNodes(nextNodes);
        setEdges(nextEdges);
        setHydrated(true);
      } catch {
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

  // SAVE debounce
  const scheduleSave = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      if (!canEdit) return;
      if (!hydrated) return;

      if (saveTimer.current) window.clearTimeout(saveTimer.current);

      saveTimer.current = window.setTimeout(async () => {
        try {
          setSavingState("saving");

          // cancelar request anterior
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
          // Si fue abort, ignoramos
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

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!canEdit) return;
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [setEdges, canEdit]
  );

  const openContextMenuAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!canEdit) return;

      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds || !rfInstance) return;

      const xInWrapper = clientX - bounds.left;
      const yInWrapper = clientY - bounds.top;

      const flowPoint = rfInstance.project({ x: xInWrapper, y: yInWrapper });

      setMenu({ open: true, x: xInWrapper, y: yInWrapper });
      setMenuPosFlow(flowPoint);
    },
    [canEdit, rfInstance]
  );

  const createNode = useCallback(
    (kind: MenuKind) => {
      if (!canEdit) return;

      const id = `${kind}-${crypto.randomUUID()}`;

      const base = {
        id,
        position: { ...menuPosFlow },
        type: kind,
      } as Node;

      const node: Node =
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
              data: { title: "Nano Banana Pro", images: [], activeIndex: 0 },
              style: { width: 420 },
            };

      setNodes((ns) => ns.concat(node));
      closeMenu();
    },
    [canEdit, menuPosFlow, setNodes]
  );

  // Right click menu
  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openContextMenuAt(e.clientX, e.clientY);
    },
    [openContextMenuAt]
  );

  // TAB opens menu in center
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") {
        e.preventDefault();
        const bounds = wrapperRef.current?.getBoundingClientRect();
        if (!bounds) return;
        openContextMenuAt(
          bounds.left + bounds.width * 0.45,
          bounds.top + bounds.height * 0.35
        );
      }
      if (e.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openContextMenuAt]);

  // Click outside closes
  useEffect(() => {
    function onMouseDown() {
      closeMenu();
    }
    if (menu.open) window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [menu.open]);

  // Drag & Drop image -> creates Image node
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit) return;
      e.preventDefault();

      const files = Array.from(e.dataTransfer.files || []);
      const img = files.find((f) => f.type.startsWith("image/"));
      if (!img || !rfInstance) return;

      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const xInWrapper = e.clientX - bounds.left;
      const yInWrapper = e.clientY - bounds.top;
      const flowPoint = rfInstance.project({ x: xInWrapper, y: yInWrapper });

      const url = URL.createObjectURL(img);
      const id = `image-${crypto.randomUUID()}`;

      setNodes((ns) =>
        ns.concat({
          id,
          type: "image",
          position: flowPoint,
          data: {
            title: "Image",
            images: [{ url, name: img.name }],
            activeIndex: 0,
          },
          style: { width: 320 },
        } as Node)
      );
    },
    [canEdit, rfInstance, setNodes]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative h-[74vh] overflow-hidden rounded-2xl border border-zinc-800 bg-black"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        onNodesChange={canEdit ? onNodesChange : undefined}
        onEdgesChange={canEdit ? onEdgesChange : undefined}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Indicador guardado */}
      <div className="absolute left-3 top-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
        {canEdit ? (
          savingState === "saving" ? "Guardando…" :
          savingState === "saved" ? "Guardado" :
          savingState === "error" ? "Error al guardar" :
          "Listo"
        ) : (
          "Solo lectura"
        )}
      </div>

      {menu.open && (
        <div
          className="absolute z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
            Crear nodo
          </div>

          <button
            className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => createNode("prompt")}
          >
            Prompt
          </button>

          <button
            className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => createNode("image")}
          >
            Image
          </button>

          <button
            className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
            onClick={() => createNode("nano")}
          >
            Nano Banana Pro
          </button>

          {!canEdit && (
            <div className="px-3 py-2 text-xs text-zinc-500">Solo lectura</div>
          )}
        </div>
      )}

      {!canEdit && (
        <div className="absolute right-3 top-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
          Modo solo lectura
        </div>
      )}
    </div>
  );
}

export default function Editor(props: EditorProps) {
  return (
    <ReactFlowProvider>
      <InnerEditor {...props} />
    </ReactFlowProvider>
  );
}