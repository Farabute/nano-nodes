"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProjectCard = {
  id: string;
  name: string;
  ownerId: string;
  // opcional: si después querés diferenciar shared/workspace
  role?: "OWNER" | "EDITOR" | "VIEWER";
};

export default function ProjectsGrid({
  projects,
  currentUserId,
}: {
  projects: ProjectCard[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [openForId, setOpenForId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenForId(null);
    }

    function onMouseDown(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpenForId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  async function deleteProject(projectId: string) {
    const ok = confirm("¿Eliminar este proyecto? No se puede deshacer.");
    if (!ok) return;

    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Error eliminando proyecto");
      return;
    }

    setOpenForId(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {projects.map((p) => {
        const canDelete = p.ownerId === currentUserId;
        const isOpen = openForId === p.id;
        const isViewer = p.role === "VIEWER";

        return (
          <div key={p.id} className="relative group">
            {/* Menu trigger (misma funcionalidad) */}
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-md border border-zinc-800 bg-black/60 px-2 py-1 text-xs text-zinc-200 opacity-0 transition group-hover:opacity-100 hover:bg-black"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenForId((prev) => (prev === p.id ? null : p.id));
              }}
              aria-label="Project menu"
              title="Opciones"
            >
              ⋯
            </button>

            {/* Card link (misma navegación) */}
            <a
              href={`/editor/${p.id}`}
              className="block"
              onClick={() => setOpenForId(null)}
            >
              {/* Square card */}
              <div
                className={[
                  "aspect-square overflow-hidden rounded-xl border",
                  "border-zinc-800/80 bg-zinc-900/20",
                  "transition-all duration-200",
                  "group-hover:border-zinc-600/80 group-hover:bg-zinc-900/35",
                  "group-hover:shadow-lg group-hover:shadow-black/30",
                ].join(" ")}
              >
                {/* Placeholder image */}
                <img
                  src="/brand/project-placeholder.webp"
                  alt="Project cover"
                  className="h-full w-full object-cover opacity-80 transition group-hover:opacity-95"
                  draggable={false}
                />
              </div>

              {/* Text */}
              <div className="mt-3">
                <div className="text-sm font-medium text-white">{p.name}</div>

                {isViewer ? (
                  <div className="mt-1 text-xs text-zinc-400">Solo lectura</div>
                ) : null}

                <div className="mt-1 text-xs text-zinc-500">ID: {p.id}</div>
              </div>
            </a>

            {/* Dropdown (misma lógica) */}
            {isOpen && (
              <div
                ref={menuRef}
                className="absolute right-3 top-12 z-20 w-44 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-lg"
              >
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/editor/${p.id}`);
                    setOpenForId(null);
                  }}
                >
                  {isViewer ? "Ver" : "Abrir"}
                </button>

                {canDelete ? (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-950/30"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteProject(p.id);
                    }}
                  >
                    Borrar
                  </button>
                ) : (
                  <div className="px-3 py-2 text-xs text-zinc-500">
                    Solo el owner puede borrar
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}