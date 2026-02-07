"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function createProject() {
    setErr(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErr("Poné un nombre (mínimo 2 caracteres).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Error creando proyecto");

      setOpen(false);
      setName("");
      router.push(`/app/projects/${data.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
      >
        + Nuevo proyecto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 text-base font-semibold">Nuevo proyecto</div>

            <label className="block text-xs text-zinc-400">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Spot Mercedes - Board"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />

            {err && <div className="mt-2 text-xs text-red-400">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/40"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={createProject}
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}