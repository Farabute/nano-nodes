import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { ProjectRole } from "@prisma/client";

export const runtime = "nodejs";

async function getUserId() {
  const session = (await getServerSession(authOptions as any)) as any;
  return session?.user?.id as string | undefined;
}

// GET: devuelve el graph actual (versionNumber=1) si tenés acceso
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const graph = await prisma.graphVersion.findFirst({
    where: { projectId, versionNumber: 1 },
    select: { nodesJson: true, edgesJson: true },
  });

  return NextResponse.json(
    {
      nodes: (graph?.nodesJson as any[]) ?? [],
      edges: (graph?.edgesJson as any[]) ?? [],
    },
    { status: 200 }
  );
}

// PUT: guarda graph actual (versionNumber=1). VIEWER no puede.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  // permiso de escritura: owner o miembro OWNER/EDITOR
  const canWrite = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              role: { in: [ProjectRole.OWNER, ProjectRole.EDITOR] },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const nodes = Array.isArray(body?.nodes) ? body.nodes : [];
  const edges = Array.isArray(body?.edges) ? body.edges : [];

  await prisma.graphVersion.upsert({
    where: {
      projectId_versionNumber: { projectId, versionNumber: 1 },
    },
    create: {
      projectId,
      versionNumber: 1,
      nodesJson: nodes,
      edgesJson: edges,
    },
    update: {
      nodesJson: nodes,
      edgesJson: edges,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}