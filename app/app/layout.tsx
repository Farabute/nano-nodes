export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[260px_1fr]">
        <aside className="sticky top-0 h-screen border-r border-zinc-800/80 bg-zinc-950/60 px-4 py-5">
          <div className="mb-6 text-lg font-semibold">Nano Nodes</div>

          <nav className="space-y-1 text-sm">
            <a
              href="/app"
              className="block rounded-lg bg-zinc-900/40 px-3 py-2 text-zinc-100"
            >
              Proyectos
            </a>

            <a
              href="/api/auth/signout"
              className="mt-6 block rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900/40 hover:text-zinc-100"
            >
              Cerrar sesión
            </a>
          </nav>
        </aside>

        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}