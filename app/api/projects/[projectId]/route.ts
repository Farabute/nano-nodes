import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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

    // Solo owner puede borrar
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