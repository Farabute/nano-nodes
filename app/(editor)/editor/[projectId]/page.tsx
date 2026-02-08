import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import Editor from "./Editor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  const userId = session.user.id as string | undefined;
  if (!userId) redirect("/signin");

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) redirect("/app");

  // por ahora
  const canEdit = true;

  return (
    <Editor
      projectId={project.id}
      projectName={project.name}
      canEdit={canEdit}
      initialNodes={[]}
      initialEdges={[]}
      initialTitle={project.name}
    />
  );
}