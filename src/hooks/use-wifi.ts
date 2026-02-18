"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getWifiByTenant,
  addWifi,
  updateWifi,
  deleteWifi,
} from "@/lib/api/admin";
import type { CreateWifiRequest, UpdateWifiRequest } from "@/types/api";

export function useWifi() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const tenantId = session?.tenantId ?? 0;

  return useQuery({
    queryKey: ["wifi", tenantId],
    queryFn: () => getWifiByTenant(token, tenantId),
    enabled: !!token && !!tenantId,
  });
}

export function useAddWifi() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: CreateWifiRequest) => addWifi(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wifi"] });
    },
  });
}

export function useUpdateWifi() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: UpdateWifiRequest) => updateWifi(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wifi"] });
    },
  });
}

export function useDeleteWifi() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (id: number) => deleteWifi(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wifi"] });
    },
  });
}
