"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/admin";
import type {
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
} from "@/types/api";

export function useCategories() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(token),
    enabled: !!token,
  });
}

export function useCategoryById(id: number | undefined) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  return useQuery({
    queryKey: ["category", id],
    queryFn: () => getCategoryById(token, id!),
    enabled: !!token && !!id,
  });
}

export function useAddCategory() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: CreateMenuCategoryRequest) => addCategory(token, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (body: UpdateMenuCategoryRequest) => updateCategory(token, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] });
    },
  });
}

export function useDeleteCategory() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";

  return useMutation({
    mutationFn: (id: number) => deleteCategory(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
