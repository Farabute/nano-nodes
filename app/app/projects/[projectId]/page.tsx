import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export default async function ProjectEditorPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  const userId = session.user.id as string | undefined;
  if (!userId) redirect("/signin");

  const projectId = params.projectId;

  // Permisos: owner o miembro
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });

  if (!project) {
    // Si no existe o no tenés permiso
    redirect("/app");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Editor (próximo paso: React Flow + autosave + versiones)
          </p>
        </div>

        <a
          href="/app"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900/40"
        >
          ← Volver
        </a>
      </div>

      <div className="h-[70vh] rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4">
        <div className="text-sm text-zinc-300">
          Acá va el canvas nodal.
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          Project ID: {project.id}
        </div>
      </div>
    </div>
  );
}