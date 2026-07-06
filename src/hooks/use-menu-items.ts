"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getMenuItems,
  getMenuItemByIdWithDetails,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  type ReorderMenuRequest,
} from "@/lib/api/admin";

export function useMenuItems(tenantId?: number) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    // tenantId: tenant claim olmayan (superadmin) hesablar üçün açıq kontekst.
    queryKey: ["menuItems", tenantId ?? null],
    queryFn: () => getMenuItems(token, tenantId),
    enabled: !!token,
  });
}

export function useMenuItemById(id: number | undefined) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    queryKey: ["menuItem", id],
    queryFn: () => getMenuItemByIdWithDetails(token, id!),
    enabled: !!token && !!id,
  });
}

export function useAddMenuItem() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (formData: FormData) => addMenuItem(token, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useUpdateMenuItem(id: number) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (formData: FormData) => updateMenuItem(token, id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      queryClient.invalidateQueries({ queryKey: ["menuItem", id] });
    },
  });
}

// Cədvəldən inline qiymət (və s.) yeniləmək üçün — id + FormData
export function useUpdateMenuItemInline() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      updateMenuItem(token, id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      queryClient.invalidateQueries({ queryKey: ["menuItem", variables.id] });
    },
  });
}

export function useDeleteMenuItem() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (id: number) => deleteMenuItem(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useReorderMenuItems() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: ReorderMenuRequest) => reorderMenuItems(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}
