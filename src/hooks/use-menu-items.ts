"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getMenuItems,
  getMenuItemByIdWithDetails,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/api/admin";

export function useMenuItems() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    queryKey: ["menuItems"],
    queryFn: () => getMenuItems(token),
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
