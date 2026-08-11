"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useBulkUpdateCategories } from "@/hooks/use-categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LanguageTabs } from "@/components/admin/LanguageTabs";
import type { AdminMenuCategory, BulkUpdateMenuCategoryRequest } from "@/types/api";

const schema = z.object({
  azName: z.string().optional(),
  enName: z.string().optional(),
  ruName: z.string().optional(),
  azDescription: z.string().optional(),
  enDescription: z.string().optional(),
  ruDescription: z.string().optional(),
  descriptionColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format: #RRGGBB")
    .optional()
    .or(z.literal("")),
  descriptionFontSize: z
    .string()
    .regex(/^\d+$/, "Rəqəm daxil edin")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface BulkEditCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AdminMenuCategory[];
  onSuccess: () => void;
}

export function BulkEditCategoriesDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: BulkEditCategoriesDialogProps) {
  const { data: session } = useSession();
  const bulkMutation = useBulkUpdateCategories();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Hər açılışda təmiz forma — əvvəlki bulk dəyərləri qalmasın
  useEffect(() => {
    if (open) reset({});
  }, [open, reset]);

  const onSubmit = async (formData: FormData) => {
    const tenantId = session?.tenantId;
    if (!tenantId) {
      toast.error("Tenant tapılmadı");
      return;
    }

    const body: BulkUpdateMenuCategoryRequest = {
      tenantId,
      ids: categories.map((c) => c.id),
      azName: formData.azName?.trim() || undefined,
      enName: formData.enName?.trim() || undefined,
      ruName: formData.ruName?.trim() || undefined,
      azDescription: formData.azDescription?.trim() || undefined,
      enDescription: formData.enDescription?.trim() || undefined,
      ruDescription: formData.ruDescription?.trim() || undefined,
      descriptionColor: formData.descriptionColor || undefined,
      descriptionFontSize: formData.descriptionFontSize
        ? Number(formData.descriptionFontSize)
        : undefined,
    };

    const hasChanges = Object.entries(body).some(
      ([key, value]) => key !== "tenantId" && key !== "ids" && value !== undefined
    );
    if (!hasChanges) {
      toast.error("Heç bir sahə doldurulmayıb");
      return;
    }

    try {
      await bulkMutation.mutateAsync(body);
      toast.success(`${categories.length} kateqoriya yeniləndi`);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Toplu redaktə ({categories.length} kateqoriya)</DialogTitle>
          <DialogDescription>
            Yalnız doldurduğunuz sahələr seçilmiş kateqoriyaların hamısına yazılacaq.
            Boş sahələr toxunulmur.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700"
            >
              {c.azName}
              <span className="text-stone-400">· {c.branchName ?? "Ümumi"}</span>
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <LanguageTabs
            azContent={
              <>
                <div className="space-y-2">
                  <Label>Ad (AZ)</Label>
                  <Input {...register("azName")} placeholder="Boş = toxunulmur" />
                </div>
                <div className="space-y-2">
                  <Label>Təsvir (AZ)</Label>
                  <Textarea {...register("azDescription")} placeholder="Boş = toxunulmur" />
                </div>
              </>
            }
            enContent={
              <>
                <div className="space-y-2">
                  <Label>Name (EN)</Label>
                  <Input {...register("enName")} placeholder="Boş = toxunulmur" />
                </div>
                <div className="space-y-2">
                  <Label>Description (EN)</Label>
                  <Textarea {...register("enDescription")} placeholder="Boş = toxunulmur" />
                </div>
              </>
            }
            ruContent={
              <>
                <div className="space-y-2">
                  <Label>Название (RU)</Label>
                  <Input {...register("ruName")} placeholder="Boş = toxunulmur" />
                </div>
                <div className="space-y-2">
                  <Label>Описание (RU)</Label>
                  <Textarea {...register("ruDescription")} placeholder="Boş = toxunulmur" />
                </div>
              </>
            }
          />

          <div className="space-y-2">
            <Label>Təsvir stili</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={watch("descriptionColor") || "#78716c"}
                  onChange={(e) =>
                    setValue("descriptionColor", e.target.value, {
                      shouldDirty: true,
                    })
                  }
                  className="h-10 w-10 cursor-pointer rounded border"
                />
                <Input
                  {...register("descriptionColor")}
                  placeholder="Rəng: boş = toxunulmur"
                />
              </div>
              <Input
                type="number"
                min={10}
                max={40}
                {...register("descriptionFontSize")}
                placeholder="Yazı ölçüsü (px): boş = toxunulmur"
              />
            </div>
            {errors.descriptionColor && (
              <p className="text-xs text-red-500">{errors.descriptionColor.message}</p>
            )}
            {errors.descriptionFontSize && (
              <p className="text-xs text-red-500">{errors.descriptionFontSize.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulkMutation.isPending}
            >
              Ləğv et
            </Button>
            <Button type="submit" disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? "Yenilənir..." : "Hamısını yenilə"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
