"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  useMenuItemById,
  useUpdateMenuItem,
} from "@/hooks/use-menu-items";
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
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageTabs } from "@/components/admin/LanguageTabs";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { getMediaUrl } from "@/lib/api/client";
import { FiX } from "react-icons/fi";

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

export default function MenuItemUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? Number(params.id) : undefined;
  const { data: session } = useSession();
  const { data: menuItem, isLoading, isError } = useMenuItemById(id);
  const { data: categories } = useCategories();
  const updateMutation = useUpdateMenuItem(id ?? 0);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<Set<number>>(
    new Set()
  );

  const tenantId = session?.tenantId ?? 0;
  const tenantCategories = (categories ?? []).filter(
    (c) => c.tenantId === tenantId
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "AZN",
      currencySign: "₼",
      discountPrice: 0,
    },
  });

  useEffect(() => {
    if (!menuItem) return;
    reset({
      azName: menuItem.azName ?? "",
      enName: menuItem.enName ?? "",
      ruName: menuItem.ruName ?? "",
      azDescription: menuItem.azDescription ?? "",
      enDescription: menuItem.enDescription ?? "",
      ruDescription: menuItem.ruDescription ?? "",
      price: menuItem.price ?? 0,
      discountPrice: menuItem.discountPrice ?? 0,
      currency: menuItem.currency ?? "AZN",
      currencySign: menuItem.currencySign ?? "₼",
      prepTimeMinutes: menuItem.prepTimeMinutes ?? "",
      menuCategoryId: menuItem.menuCategoryId ?? 0,
    });
    if (menuItem.menuItemImages?.length) {
      setExistingImageIds(
        new Set(menuItem.menuItemImages.map((img) => img.id))
      );
    }
  }, [menuItem, reset]);

  const onSubmit = async (formData: FormData) => {
    if (!id) return;

    const fd = new FormData();
    fd.append("currency", formData.currency);
    fd.append("azName", formData.azName);
    fd.append("enName", formData.enName);
    fd.append("ruName", formData.ruName);
    fd.append("currencySign", formData.currencySign);

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

    fd.append("price", formData.price.toFixed(2));
    fd.append("discountPrice", String(formData.discountPrice || 0));
    fd.append("menuCategoryId", String(formData.menuCategoryId));

    newFiles.forEach((file) => {
      fd.append("files", file);
    });

    try {
      await updateMutation.mutateAsync(fd);
      toast.success("Menyu itemi yeniləndi");
      router.push("/admin/menu/items");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Xəta baş verdi";
      toast.error(errorMessage);
      console.error("[MenuItem] Update error:", error);
    }
  };

  const existingImages =
    menuItem?.menuItemImages?.filter((img) => existingImageIds.has(img.id)) ??
    [];

  const handleRemoveExistingImage = (imageId: number) => {
    setExistingImageIds((prev) => {
      const next = new Set(prev);
      next.delete(imageId);
      return next;
    });
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

  if (isError || !menuItem) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">
          Menyu itemini yenilə
        </h1>
        <p className="text-stone-600">Menu item tapılmadı.</p>
        <Button variant="outline" onClick={() => router.push("/admin/menu/items")}>
          Geri
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">
        Menyu itemini yenilə: {menuItem.azName}
      </h1>

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
                      <p className="text-xs text-red-500">
                        {errors.azName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Təsvir (AZ)</Label>
                    <Textarea
                      {...register("azDescription")}
                      placeholder="Təsvir"
                    />
                  </div>
                </>
              }
              enContent={
                <>
                  <div className="space-y-2">
                    <Label>Name (EN)</Label>
                    <Input {...register("enName")} placeholder="Item name" />
                    {errors.enName && (
                      <p className="text-xs text-red-500">
                        {errors.enName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description (EN)</Label>
                    <Textarea
                      {...register("enDescription")}
                      placeholder="Description"
                    />
                  </div>
                </>
              }
              ruContent={
                <>
                  <div className="space-y-2">
                    <Label>Название (RU)</Label>
                    <Input {...register("ruName")} placeholder="Название" />
                    {errors.ruName && (
                      <p className="text-xs text-red-500">
                        {errors.ruName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Описание (RU)</Label>
                    <Textarea
                      {...register("ruDescription")}
                      placeholder="Описание"
                    />
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
                  value={watch("menuCategoryId") ? String(watch("menuCategoryId")) : ""}
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
                  <p className="text-xs text-red-500">
                    {errors.menuCategoryId.message}
                  </p>
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
                  <p className="text-xs text-red-500">
                    {errors.currencySign.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Qiymət</Label>
                <Input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="12.50"
                />
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
          <CardContent className="space-y-4">
            {existingImages.length > 0 && (
              <div>
                <Label className="mb-2 block">Mövcud şəkillər</Label>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getMediaUrl(img.path)}
                        alt={img.fileName}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.id)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                        title="Şəkildən imtina et (sadəcə UI)"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Sil düyməsi yalnız bu ekrandan çıxarır
                </p>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Yeni şəkillər əlavə et</Label>
              <ImageUpload
                files={newFiles}
                onChange={setNewFiles}
                maxFiles={5}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Yenilənir..." : "Yenilə"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/menu/items")}
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
    </div>
  );
}
