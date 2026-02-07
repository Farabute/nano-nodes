import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

import NewProjectButton from "./NewProjectButton";
import ProjectsGrid from "./ProjectsGrid";

import { ProjectRole, Prisma } from "@prisma/client";

type Tab = "my" | "workspace" | "shared";

export default async function AppHome({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  const userId = session.user.id as string | undefined;
  if (!userId) redirect("/signin");

  const sp = (await searchParams) ?? {};
  const tab: Tab =
    sp.tab === "workspace" || sp.tab === "shared" || sp.tab === "my"
      ? (sp.tab as Tab)
      : "my";

  const where: Prisma.ProjectWhereInput =
    tab === "my"
      ? { ownerId: userId }
      : tab === "workspace"
      ? {
          ownerId: { not: userId },
          members: {
            some: {
              userId,
              role: { in: [ProjectRole.OWNER, ProjectRole.EDITOR] },
            },
          },
        }
      : {
          ownerId: { not: userId },
          members: { some: { userId, role: ProjectRole.VIEWER } },
        };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, ownerId: true },
  });

  const title =
    tab === "my"
      ? "My Files"
      : tab === "workspace"
      ? "Workspace Files"
      : "Shared with me";

  const subtitle =
    tab === "my"
      ? "Tus proyectos (owner)."
      : tab === "workspace"
      ? "Proyectos donde podés editar."
      : "Proyectos compartidos (solo lectura).";

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>

        {tab === "my" ? <NewProjectButton /> : null}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 text-sm text-zinc-300">
          No hay proyectos en esta sección.
        </div>
      ) : (
        <ProjectsGrid projects={projects} currentUserId={userId} />
      )}
    </>
  );
}