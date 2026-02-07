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

  return (
    <div className="flex h-[100dvh] bg-black">
      {/* Left Rail (barra finita) */}
      <div className="w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4">
        <img
          src="/brand/piko-nodes-logo-256.webp"
          alt="Piko Nodes"
          className="h-8 w-auto mb-6"
        />

        {/* iconos futuros */}
        <div className="flex flex-col gap-4">
          <button className="h-10 w-10 rounded-lg bg-zinc-900 hover:bg-zinc-800" />
          <button className="h-10 w-10 rounded-lg bg-zinc-900 hover:bg-zinc-800" />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}