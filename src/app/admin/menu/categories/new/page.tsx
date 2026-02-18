"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAddCategory } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function NewCategoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const addMutation = useAddCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (formData: FormData) => {
    const tenantId = session?.tenantId;
    if (!tenantId) {
      toast.error("Tenant tapılmadı");
      return;
    }

    try {
      await addMutation.mutateAsync({
        ...formData,
        tenantId,
      });
      toast.success("Kateqoriya əlavə edildi");
      router.push("/admin/menu/categories");
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Yeni kateqoriya</h1>

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
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Əlavə edilir..." : "Əlavə et"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/menu/categories")}
              >
                Ləğv et
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
