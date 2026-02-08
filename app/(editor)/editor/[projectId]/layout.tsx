import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/signin");

  // ✅ Importante: este layout NO dibuja ningún rail.
  // El rail y el canvas los maneja Editor.tsx
  return <div className="h-screen w-screen bg-black">{children}</div>;
}