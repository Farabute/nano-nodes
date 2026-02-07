// app/app/SignOutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="w-full rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/60"
    >
      Cerrar sesión
    </button>
  );
}