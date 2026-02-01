"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="border rounded-xl p-6 space-y-4 w-80">
        <h1 className="text-xl font-semibold">Nano Nodes</h1>

        <button
          onClick={() => signIn("google", { callbackUrl: "/projects" })}
          className="w-full px-4 py-2 rounded bg-black text-white"
        >
          Continuar con Google
        </button>
      </div>
    </main>
  );
}