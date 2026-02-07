type View = "my" | "workspace" | "shared";

export default function Sidebar({
  active,
  counts,
}: {
  active: View;
  counts: { my: number; workspace: number; shared: number };
}) {
  const itemClass = (isActive: boolean) =>
    [
      "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
      isActive
        ? "bg-zinc-800/60 text-zinc-100"
        : "text-zinc-300 hover:bg-zinc-900/40",
    ].join(" ");

  return (
    <aside className="w-[260px] shrink-0">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Projects
        </div>

        <nav className="space-y-1">
          <a href="/app?view=my" className={itemClass(active === "my")}>
            <span>My Files</span>
            <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-xs text-zinc-200">
              {counts.my}
            </span>
          </a>

          <a
            href="/app?view=workspace"
            className={itemClass(active === "workspace")}
          >
            <span>Workspace Files</span>
            <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-xs text-zinc-200">
              {counts.workspace}
            </span>
          </a>

          <a
            href="/app?view=shared"
            className={itemClass(active === "shared")}
          >
            <span>Shared with me</span>
            <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-xs text-zinc-200">
              {counts.shared}
            </span>
          </a>
        </nav>
      </div>
    </aside>
  );
}