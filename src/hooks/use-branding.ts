"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { addBranding, getBranding } from "@/lib/api/admin";

export function useBranding() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    queryKey: ["branding"],
    queryFn: () => getBranding(token),
    enabled: !!token,
  });
}

export function useAddBranding() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";
  const roles = session?.roles ?? session?.user?.roles ?? [];
  const isSuperAdmin = roles.some(
    (r) => r === "Super Admin" || r === "SuperAdmin"
  );

  return useMutation({
    mutationFn: (formData: FormData) => addBranding(token, formData, isSuperAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      queryClient.invalidateQueries({ queryKey: ["tenantConfig"] });
    },
  });
}
