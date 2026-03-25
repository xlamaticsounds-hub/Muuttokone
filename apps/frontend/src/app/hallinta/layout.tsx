import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
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

  return (
    <AdminLayoutShell userEmail={session.user?.email}>
      {children}
    </AdminLayoutShell>
  );
}
