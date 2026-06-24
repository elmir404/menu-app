"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { listBranches } from "@/lib/api/admin";

export function useBranches() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    queryKey: ["branches"],
    queryFn: () => listBranches(token),
    enabled: !!token,
  });
}
