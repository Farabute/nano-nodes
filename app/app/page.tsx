import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import NewProjectButton from "./NewProjectButton";
import Sidebar from "./Sidebar";
import ProjectsGrid from "./ProjectsGrid";

type View = "my" | "workspace" | "shared";

export default async function AppHome({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  const userId = session.user.id as string | undefined;
  if (!userId) redirect("/signin");

  const sp = (await searchParams) ?? {};
  const view = (["my", "workspace", "shared"].includes(sp.view ?? "")
    ? (sp.view as View)
    : "my") as View;

  // 1) Mis proyectos (owner)
  const owned = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, ownerId: true },
  });

  // 2) Proyectos compartidos conmigo (miembro)
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: {
      role: true,
      project: { select: { id: true, name: true, ownerId: true } },
    },
    orderBy: { project: { updatedAt: "desc" } },
  });

  const workspace = memberships
    .filter((m) => m.role === "EDITOR")
    .map((m) => m.project);

  const sharedView = memberships
    .filter((m) => m.role === "VIEWER")
    .map((m) => m.project);

  const counts = {
    my: owned.length,
    workspace: workspace.length,
    shared: sharedView.length,
  };

  const projects =
    view === "my" ? owned : view === "workspace" ? workspace : sharedView;

  const title =
    view === "my"
      ? "My Files"
      : view === "workspace"
      ? "Workspace Files"
      : "Shared with me (View)";

  return (
    <div className="flex gap-6">
      <Sidebar active={view} counts={counts} />

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {view === "my"
                ? "Tus proyectos (owner)."
                : view === "workspace"
                ? "Proyectos donde podés editar."
                : "Proyectos compartidos solo para ver."}
            </p>
          </div>

          {/* Crear solo en "my" */}
          {view === "my" ? <NewProjectButton /> : null}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 text-sm text-zinc-300">
            No hay proyectos en esta sección.
          </div>
        ) : (
          <ProjectsGrid projects={projects} currentUserId={userId} />
        )}
      </div>
    </div>
  );
}