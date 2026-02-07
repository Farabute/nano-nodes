// app/app/layout.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ProjectRole } from "@prisma/client";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import SidebarNav from "./SidebarNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  const userId = session.user.id as string | undefined;
  if (!userId) redirect("/signin");

  const [myCount, workspaceCount, sharedCount] = await Promise.all([
    prisma.project.count({ where: { ownerId: userId } }),

    prisma.project.count({
      where: {
        ownerId: { not: userId },
        members: {
          some: {
            userId,
            role: { in: [ProjectRole.OWNER, ProjectRole.EDITOR] },
          },
        },
      },
    }),

    prisma.project.count({
      where: {
        ownerId: { not: userId },
        members: { some: { userId, role: ProjectRole.VIEWER } },
      },
    }),
  ]);

  return (
    <div className="flex min-h-[100dvh] bg-black text-zinc-100">
      <SidebarNav
        counts={{ my: myCount, workspace: workspaceCount, shared: sharedCount }}
      />

      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}