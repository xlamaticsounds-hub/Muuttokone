import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getActor } from "@/server/access";
import { loginUrl, teamWhere } from "@/lib/access";
import AdminLayoutShell from "./AdminLayoutShell";
import React from "react";

// Yhteinen kehys kaikille hallinnan sivuille. Huom: tätä ei ajeta uudelleen, kun sivulta toiselle siirrytään
// linkillä, joten oikeudet tarkistetaan jokaisella sivulla erikseen (requirePageAccess, server/access.ts).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActor();

  if (!actor) {
    redirect(loginUrl("/hallinta"));
  }

  // Käynnissä olevat työaikaleimat näkyvät valikossa, ettei leimaus unohdu päälle. Virhe ei saa kaataa hallintaa.
  let runningTimers = 0;
  let teamName: string | null = null;
  try {
    const [count, team] = await Promise.all([
      prisma.timeEntry.count({ where: { endedAt: null, ...teamWhere(actor) } }),
      actor.teamId ? prisma.team.findUnique({ where: { id: actor.teamId }, select: { name: true } }) : null,
    ]);
    runningTimers = count;
    teamName = team?.name ?? null;
  } catch {
    runningTimers = 0;
  }

  return (
    <AdminLayoutShell
      userEmail={actor.email}
      userName={actor.name}
      role={actor.role}
      teamName={teamName}
      runningTimers={runningTimers}
    >
      {children}
    </AdminLayoutShell>
  );
}
