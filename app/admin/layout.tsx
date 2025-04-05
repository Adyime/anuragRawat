"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { data: session, status } = useSession();
  // const router = useRouter();

  // useEffect(() => {
  //   if (status === "unauthenticated") {
  //     router.push("/auth/signin");
  //     return;
  //   }

  //   if (session?.user?.role !== "ADMIN") {
  //     router.push("/");
  //     return;
  //   }
  // }, [session, status, router]);

  // if (status === "loading") {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  //     </div>
  //   );
  // }

  // if (!session || session.user.role !== "ADMIN") {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
