import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Project name is required (min 2 chars)" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        ownerId: userId,
        graphs: {
          create: {
            versionNumber: 1,
            nodesJson: [],
            edgesJson: [],
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("POST /api/projects failed:", err);
    return NextResponse.json(
      { error: "Internal error creating project" },
      { status: 500 }
    );
  }
}