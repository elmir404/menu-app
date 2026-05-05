"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getLinksByTenant,
  addLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from "@/lib/api/admin";
import type {
  CreateLinkRequest,
  UpdateLinkRequest,
  ReorderLinksRequest,
} from "@/types/api";

export function useLinks() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const tenantId = session?.tenantId ?? 0;

  return useQuery({
    queryKey: ["links", tenantId],
    queryFn: () => getLinksByTenant(token, tenantId),
    enabled: !!token && !!tenantId,
  });
}

export function useAddLink() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: CreateLinkRequest) => addLink(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useUpdateLink() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: UpdateLinkRequest) => updateLink(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useDeleteLink() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (id: number) => deleteLink(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useReorderLinks() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: ReorderLinksRequest) => reorderLinks(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}
