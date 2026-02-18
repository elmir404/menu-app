"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAddBranding } from "@/hooks/use-branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/ImageUpload";

const schema = z.object({
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  backgroundColor: z.string().min(1),
  textColor: z.string().min(1),
  description: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function BrandingPage() {
  const { data: session } = useSession();
  const addMutation = useAddBranding();
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [bgFiles, setBgFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: "#000000",
      secondaryColor: "#FFFFFF",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
    },
  });

  const onSubmit = async (formData: FormData) => {
    const tenantId = session?.tenantId;
    if (!tenantId) {
      toast.error("Tenant tapılmadı");
      return;
    }

    const fd = new FormData();
    fd.append("tenantId", String(tenantId));
    fd.append("primaryColor", formData.primaryColor);
    fd.append("secondaryColor", formData.secondaryColor);
    fd.append("backgroundColor", formData.backgroundColor || "#FFFFFF");
    fd.append("textColor", formData.textColor || "#000000");
    if (formData.description) fd.append("description", formData.description);
    if (formData.website) fd.append("website", formData.website);

    if (logoFiles[0]) {
      fd.append("logoFile", logoFiles[0]);
    } else if (formData.logoUrl) {
      fd.append("logoUrl", formData.logoUrl);
    }

    if (bgFiles[0]) {
      fd.append("backgroundImageFile", bgFiles[0]);
    } else if (formData.backgroundImageUrl) {
      fd.append("backgroundImageUrl", formData.backgroundImageUrl);
    }

    try {
      await addMutation.mutateAsync(fd);
      toast.success("Branding yeniləndi");
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Branding</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rənglər</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Əsas rəng (Primary)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("primaryColor")}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input {...register("primaryColor")} placeholder="#000000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>İkinci rəng (Secondary)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("secondaryColor")}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input {...register("secondaryColor")} placeholder="#FFFFFF" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Arxa fon rəngi</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("backgroundColor")}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input {...register("backgroundColor")} placeholder="#FFFFFF" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mətn rəngi</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register("textColor")}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input {...register("textColor")} placeholder="#000000" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ümumi məlumat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Təsvir</Label>
              <Textarea
                {...register("description")}
                placeholder="Restoranınız haqqında qısa məlumat"
              />
            </div>
            <div className="space-y-2">
              <Label>Veb-sayt</Label>
              <Input
                {...register("website")}
                placeholder="https://example.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload files={logoFiles} onChange={setLogoFiles} maxFiles={1} />
            <div className="text-center text-xs text-stone-400">və ya</div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input {...register("logoUrl")} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arxa fon şəkli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload files={bgFiles} onChange={setBgFiles} maxFiles={1} />
            <div className="text-center text-xs text-stone-400">və ya</div>
            <div className="space-y-2">
              <Label>Arxa fon URL</Label>
              <Input
                {...register("backgroundImageUrl")}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={addMutation.isPending}>
          {addMutation.isPending ? "Saxlanılır..." : "Saxla"}
        </Button>
      </form>
    </div>
  );
}
