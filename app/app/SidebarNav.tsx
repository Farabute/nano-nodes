"use client";

import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Counts = {
  my: number;
  workspace: number;
  shared: number;
};

export default function SidebarNav({ counts }: { counts: Counts }) {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab") ?? "my";

  const Item = ({
    id,
    label,
    count,
  }: {
    id: "my" | "workspace" | "shared";
    label: string;
    count: number;
  }) => {
    const active = tab === id;

    return (
      <button
        type="button"
        onClick={() => router.push(`/app?tab=${id}`)}
        className={[
          "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
          "flex items-center justify-between",
          active
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
        ].join(" ")}
      >
        <span>{label}</span>

        <span
          className={[
            "ml-3 inline-flex min-w-6 items-center justify-center rounded-md px-2 py-0.5 text-xs",
            active
              ? "bg-zinc-700 text-white"
              : "bg-zinc-900 text-zinc-400",
          ].join(" ")}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <aside className="flex h-[100dvh] w-64 flex-col bg-black border-r border-zinc-900">
      {/* Logo + Nombre */}
        <div className="px-5 py-6 flex items-center gap-4">
        <img
            src="/brand/piko-nodes-logo-256.webp"
            alt="Piko Nodes"
            className="h-10 w-auto object-contain"
        />

        <div className="flex flex-col leading-tight">
            <span className="text-xl font-semibold tracking-tight text-white">
            Piko
            </span>
            <span className="text-sm text-zinc-400 -mt-1 tracking-wide">
            Nodes
            </span>
        </div>
        </div>

      {/* Sección Projects */}
      <div className="px-3">
        <div className="px-2 pb-3 text-xs tracking-wider text-zinc-500">
          PROJECTS
        </div>

        <div className="space-y-2">
          <Item id="my" label="My Files" count={counts.my} />
          <Item id="workspace" label="Workspace Files" count={counts.workspace} />
          <Item id="shared" label="Shared with me" count={counts.shared} />
        </div>
      </div>

      {/* Logout abajo */}
      <div className="mt-auto px-3 pb-6">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}