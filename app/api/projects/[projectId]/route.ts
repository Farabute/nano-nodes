import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { ProjectRole } from "@prisma/client";

export const runtime = "nodejs";

// PATCH: actualizar nombre del proyecto (owner o miembro OWNER/EDITOR)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

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
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/projects/[projectId] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE: borrar proyecto (solo owner)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Not found or forbidden" },
        { status: 404 }
      );
    }

    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/projects/[projectId] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}