"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  useCategoryById,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageTabs } from "@/components/admin/LanguageTabs";

const schema = z.object({
  azName: z.string().min(1, "AZ ad tələb olunur"),
  enName: z.string().min(1, "EN ad tələb olunur"),
  ruName: z.string().min(1, "RU ad tələb olunur"),
  azDescription: z.string().optional(),
  enDescription: z.string().optional(),
  ruDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CategoryUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? Number(params.id) : undefined;
  const { data: category, isLoading, isError } = useCategoryById(id);
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!category) return;
    reset({
      azName: category.azName ?? "",
      enName: category.enName ?? "",
      ruName: category.ruName ?? "",
      azDescription: category.azDescription ?? "",
      enDescription: category.enDescription ?? "",
      ruDescription: category.ruDescription ?? "",
    });
  }, [category, reset]);

  const onSubmit = async (formData: FormData) => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({
        id,
        azName: formData.azName.trim(),
        enName: formData.enName.trim(),
        ruName: formData.ruName.trim(),
        azDescription: formData.azDescription?.trim() || undefined,
        enDescription: formData.enDescription?.trim() || undefined,
        ruDescription: formData.ruDescription?.trim() || undefined,
      });
      toast.success("Kateqoriya uğurla yeniləndi");
      router.push("/admin/menu/categories");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Xəta baş verdi";
      toast.error(errorMessage);
      console.error("[Category] Update error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !category) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">
          Kateqoriyanı yenilə
        </h1>
        <p className="text-stone-600">Kateqoriya tapılmadı.</p>
        <Button variant="outline" onClick={() => router.push("/admin/menu/categories")}>
          Geri
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">
        Kateqoriyanı yenilə: {category.azName}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Kateqoriya məlumatları</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <LanguageTabs
              azContent={
                <>
                  <div className="space-y-2">
                    <Label>Ad (AZ)</Label>
                    <Input {...register("azName")} placeholder="Kateqoriya adı" />
                    {errors.azName && (
                      <p className="text-xs text-red-500">{errors.azName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Təsvir (AZ)</Label>
                    <Textarea {...register("azDescription")} placeholder="Təsvir (ixtiyari)" />
                  </div>
                </>
              }
              enContent={
                <>
                  <div className="space-y-2">
                    <Label>Name (EN)</Label>
                    <Input {...register("enName")} placeholder="Category name" />
                    {errors.enName && (
                      <p className="text-xs text-red-500">{errors.enName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description (EN)</Label>
                    <Textarea {...register("enDescription")} placeholder="Description (optional)" />
                  </div>
                </>
              }
              ruContent={
                <>
                  <div className="space-y-2">
                    <Label>Название (RU)</Label>
                    <Input {...register("ruName")} placeholder="Название категории" />
                    {errors.ruName && (
                      <p className="text-xs text-red-500">{errors.ruName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Описание (RU)</Label>
                    <Textarea {...register("ruDescription")} placeholder="Описание (необязательно)" />
                  </div>
                </>
              }
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Yenilənir..." : "Yenilə"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/menu/categories")}
              >
                Ləğv et
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Geri
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
