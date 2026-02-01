import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Nano Nodes</div>
          <Link
            href="/signin"
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-20">
          <h1 className="text-6xl font-semibold tracking-tight">
            Artistic Intelligence
          </h1>
          <p className="mt-6 max-w-xl text-zinc-400">
            Node-based workflows para generar imágenes con Nano Banana.
            Guardado, versionado y colaboración.
          </p>

          <div className="mt-10 flex gap-3">
            <Link
              href="/signin"
              className="rounded-lg bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-white"
            >
              Start now
            </Link>
            <a
              href="#"
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-900/40"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}