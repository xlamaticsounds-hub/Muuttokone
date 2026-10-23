import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import AdminLayoutShell from "./AdminLayoutShell";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/hallinta");
  }

  // Käynnissä olevat työaikaleimat näkyvät valikossa, ettei leimaus unohdu päälle. Virhe ei saa kaataa hallintaa.
  let runningTimers = 0;
  try {
    runningTimers = await prisma.timeEntry.count({ where: { endedAt: null } });
  } catch {
    runningTimers = 0;
  }

  return (
    <AdminLayoutShell userEmail={session.user?.email} runningTimers={runningTimers}>
      {children}
    </AdminLayoutShell>
  );
}
