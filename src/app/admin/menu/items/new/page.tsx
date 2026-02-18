"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAddMenuItem } from "@/hooks/use-menu-items";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageTabs } from "@/components/admin/LanguageTabs";
import { ImageUpload } from "@/components/admin/ImageUpload";

const schema = z.object({
  azName: z.string().min(1, "AZ ad tələb olunur"),
  enName: z.string().min(1, "EN ad tələb olunur"),
  ruName: z.string().min(1, "RU ad tələb olunur"),
  azDescription: z.string().optional().nullable(),
  enDescription: z.string().optional().nullable(),
  ruDescription: z.string().optional().nullable(),
  price: z.number().min(0.01, "Qiymət tələb olunur"),
  discountPrice: z.number().min(0).optional(),
  currency: z.string().min(1, "Valyuta tələb olunur"),
  currencySign: z.string().min(1, "Valyuta simvolu tələb olunur"),
  prepTimeMinutes: z.string().optional().nullable(),
  menuCategoryId: z.number().min(1, "Kateqoriya seçin"),
});

type FormData = z.infer<typeof schema>;

export default function NewMenuItemPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: categories } = useCategories();
  const addMutation = useAddMenuItem();
  const [files, setFiles] = useState<File[]>([]);

  const tenantId = session?.tenantId ?? 0;
  const tenantCategories = (categories ?? []).filter(
    (c) => c.tenantId === tenantId
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "AZN",
      currencySign: "₼",
      discountPrice: 0,
    },
  });

  const onSubmit = async (formData: FormData) => {
    // FormData yarat və bütün sahələri əlavə et
    const fd = new FormData();

    // Required text sahələri
    fd.append("currency", formData.currency);
    fd.append("azName", formData.azName);
    fd.append("enName", formData.enName);
    fd.append("ruName", formData.ruName);
    fd.append("currencySign", formData.currencySign);

    // Optional text sahələri (yalnız doldurulubsa əlavə et)
    if (formData.azDescription?.trim()) {
      fd.append("azDescription", formData.azDescription);
    }
    if (formData.enDescription?.trim()) {
      fd.append("enDescription", formData.enDescription);
    }
    if (formData.ruDescription?.trim()) {
      fd.append("ruDescription", formData.ruDescription);
    }
    if (formData.prepTimeMinutes?.trim()) {
      fd.append("prepTimeMinutes", formData.prepTimeMinutes);
    }

    // Number sahələri string kimi göndər (backend gözləyir)
    fd.append("price", formData.price.toFixed(2)); // 12.50 formatında
    fd.append("discountPrice", String(formData.discountPrice || 0));
    fd.append("menuCategoryId", String(formData.menuCategoryId));

    // Şəkilləri əlavə et (multiple files)
    files.forEach((file) => {
      fd.append("files", file);
    });

    try {
      await addMutation.mutateAsync(fd);
      toast.success("Menyu itemi əlavə edildi");
      router.push("/admin/menu/items");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Xəta baş verdi";
      toast.error(errorMessage);
      console.error("[MenuItem] Add error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Yeni menyu itemi</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ad və təsvir</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageTabs
              azContent={
                <>
                  <div className="space-y-2">
                    <Label>Ad (AZ)</Label>
                    <Input {...register("azName")} placeholder="Məhsul adı" />
                    {errors.azName && (
                      <p className="text-xs text-red-500">{errors.azName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Təsvir (AZ)</Label>
                    <Textarea {...register("azDescription")} placeholder="Təsvir" />
                  </div>
                </>
              }
              enContent={
                <>
                  <div className="space-y-2">
                    <Label>Name (EN)</Label>
                    <Input {...register("enName")} placeholder="Item name" />
                    {errors.enName && (
                      <p className="text-xs text-red-500">{errors.enName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description (EN)</Label>
                    <Textarea {...register("enDescription")} placeholder="Description" />
                  </div>
                </>
              }
              ruContent={
                <>
                  <div className="space-y-2">
                    <Label>Название (RU)</Label>
                    <Input {...register("ruName")} placeholder="Название" />
                    {errors.ruName && (
                      <p className="text-xs text-red-500">{errors.ruName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Описание (RU)</Label>
                    <Textarea {...register("ruDescription")} placeholder="Описание" />
                  </div>
                </>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qiymət və kateqoriya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kateqoriya</Label>
                <Select
                  onValueChange={(val) => setValue("menuCategoryId", Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kateqoriya seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.azName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.menuCategoryId && (
                  <p className="text-xs text-red-500">{errors.menuCategoryId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Hazırlıq müddəti (dəq)</Label>
                <Input {...register("prepTimeMinutes")} placeholder="25" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valyuta</Label>
                <Input {...register("currency")} placeholder="AZN" />
                {errors.currency && (
                  <p className="text-xs text-red-500">{errors.currency.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valyuta simvolu</Label>
                <Input {...register("currencySign")} placeholder="₼" />
                {errors.currencySign && (
                  <p className="text-xs text-red-500">{errors.currencySign.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Qiymət</Label>
                <Input {...register("price", { valueAsNumber: true })} type="number" step="0.01" placeholder="12.50" />
                {errors.price && (
                  <p className="text-xs text-red-500">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Endirimli qiymət</Label>
                <Input
                  {...register("discountPrice", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Şəkillər</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload files={files} onChange={setFiles} maxFiles={5} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Əlavə edilir..." : "Əlavə et"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/menu/items")}
          >
            Ləğv et
          </Button>
        </div>
      </form>
    </div>
  );
}
