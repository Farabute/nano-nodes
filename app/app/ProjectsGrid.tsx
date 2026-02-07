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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((p) => {
        const canDelete = p.ownerId === currentUserId;
        const isOpen = openForId === p.id;
        const isViewer = p.role === "VIEWER";

        return (
          <div
            key={p.id}
            className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4 hover:bg-zinc-900/35"
          >
            {/* Menu trigger */}
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900/60"
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

            {/* Card link */}
            <a href={`/app/projects/${p.id}`} className="block">
              <div className="text-base font-medium">{p.name}</div>

              {isViewer ? (
                <div className="mt-2 text-xs text-zinc-500">Solo lectura</div>
              ) : null}

              <div className="mt-2 text-xs text-zinc-500">ID: {p.id}</div>
            </a>

            {/* Dropdown */}
            {isOpen && (
              <div
                ref={menuRef}
                className="absolute right-2 top-10 w-44 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-lg"
              >
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/app/projects/${p.id}`);
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