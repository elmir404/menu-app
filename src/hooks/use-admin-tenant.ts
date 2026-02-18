"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getTenantConfigBySlug } from "@/lib/api/admin";

/**
 * Hook to fetch the authenticated admin's tenant config.
 * Uses the tenantSlug from the session to fetch branding, name, etc.
 */
export function useAdminTenant() {
  const { data: session } = useSession();
  const tenantSlug = session?.tenantSlug ?? "";

  return useQuery({
    queryKey: ["adminTenant", tenantSlug],
    queryFn: () => getTenantConfigBySlug(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });
}
