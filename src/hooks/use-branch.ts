"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getBranchById,
  updateBranchUrl,
  type BranchSocialUrls,
} from "@/lib/api/admin";

export function useMyBranch() {
  const { data: session } = useSession();
  const branchId = session?.branchId ?? null;
  const token = session?.accessToken ?? "";
  return useQuery({
    queryKey: ["my-branch", branchId],
    queryFn: () => getBranchById(token, branchId!),
    enabled: !!token && !!branchId,
  });
}

export function useUpdateBranchUrl() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";
  const branchId = session?.branchId ?? null;

  return useMutation({
    mutationFn: (vars: { field: keyof BranchSocialUrls; value: string | null }) => {
      if (!branchId) throw new Error("Branch Id missing");
      return updateBranchUrl(token, branchId, vars.field, vars.value);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["my-branch"] }),
  });
}
