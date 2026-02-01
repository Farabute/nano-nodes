import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export default async function AppHome() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  const userId = session.user.id as string | undefined;
  if (!userId) redirect("/signin");

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proyectos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tus grafos y proyectos.
          </p>
        </div>

        <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
          + Nuevo proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 text-sm text-zinc-300">
          No tenés proyectos todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((p) => (
            <a
              key={p.id}
              href={`/projects/${p.id}`}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4 hover:bg-zinc-900/35"
            >
              <div className="text-base font-medium">{p.name}</div>
              <div className="mt-2 text-xs text-zinc-500">ID: {p.id}</div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}