"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useBulkUpdateMenuItems } from "@/hooks/use-menu-items";
import type { AdminMenuCategory, AdminMenuItem } from "@/types/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AdminMenuItem[]; // seçilmiş itemlər
  categories: AdminMenuCategory[]; // filial scope-una uyğun kateqoriyalar
  onSuccess: () => void;
}

/**
 * Seçilmiş itemlərin toplu redaktəsi. Yalnız DOLU sahələr backend-də tətbiq olunur.
 * Şəkillər yüklənsə, itemlərin bütün köhnə şəkilləri bunlarla ƏVƏZ olunur.
 * Qiymət/endirim yalnız bilərəkdən doldurulduqda dəyişir.
 */
export function BulkEditItemsDialog({ open, onOpenChange, items, categories, onSuccess }: Props) {
  const { data: session } = useSession();
  const bulkMutation = useBulkUpdateMenuItems();

  const [azName, setAzName] = useState("");
  const [enName, setEnName] = useState("");
  const [ruName, setRuName] = useState("");
  const [azDescription, setAzDescription] = useState("");
  const [enDescription, setEnDescription] = useState("");
  const [ruDescription, setRuDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [applyPerBranch, setApplyPerBranch] = useState(true);
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);

  // Kateqoriyaları ad üzrə dedupe et (Ümumi/branchId==null üstün) — filial dublikatları bir sətir.
  const dedupedCategories = useMemo(() => {
    const byName = new Map<string, AdminMenuCategory>();
    for (const c of categories) {
      const key = (c.azName ?? "").trim().toLowerCase();
      const cur = byName.get(key);
      if (!cur || (cur.branchId != null && c.branchId == null)) byName.set(key, c);
    }
    return [...byName.values()];
  }, [categories]);

  const reset = () => {
    setAzName(""); setEnName(""); setRuName("");
    setAzDescription(""); setEnDescription(""); setRuDescription("");
    setPrepTime(""); setCategoryId(""); setApplyPerBranch(true); setPrice(""); setDiscountPrice("");
    setFiles([]); setVideoFile(null); setRemoveVideo(false);
  };

  const handleSubmit = async () => {
    const fd = new FormData();
    fd.append("tenantId", String(session?.tenantId ?? 0));
    items.forEach((i) => fd.append("ids", String(i.id)));

    const put = (key: string, val: string) => {
      if (val.trim()) fd.append(key, val.trim());
    };
    put("azName", azName);
    put("enName", enName);
    put("ruName", ruName);
    put("azDescription", azDescription);
    put("enDescription", enDescription);
    put("ruDescription", ruDescription);
    put("prepTimeMinutes", prepTime);
    if (categoryId) {
      fd.append("menuCategoryId", categoryId);
      if (applyPerBranch) fd.append("applyCategoryPerBranch", "true");
    }
    // Qiymət yalnız bilərəkdən doldurulanda göndərilir
    if (price.trim() && Number.isFinite(parseFloat(price)))
      fd.append("price", parseFloat(price.replace(",", ".")).toFixed(2));
    if (discountPrice.trim() && Number.isFinite(parseFloat(discountPrice)))
      fd.append("discountPrice", parseFloat(discountPrice.replace(",", ".")).toFixed(2));

    files.forEach((f) => fd.append("files", f));
    if (videoFile) fd.append("ingredientVideoFile", videoFile);
    if (removeVideo) fd.append("removeIngredientVideo", "true");

    try {
      await bulkMutation.mutateAsync(fd);
      toast.success(`${items.length} item yeniləndi`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Toplu redaktə — {items.length} item</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-stone-500">
          Yalnız doldurduğunuz sahələr dəyişəcək. Boş qalan sahələr toxunulmur.
        </p>

        <div className="space-y-4">
          <Tabs defaultValue="az">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="az">AZ</TabsTrigger>
              <TabsTrigger value="en">EN</TabsTrigger>
              <TabsTrigger value="ru">RU</TabsTrigger>
            </TabsList>
            <TabsContent value="az" className="space-y-2">
              <Label>Ad (AZ)</Label>
              <Input value={azName} onChange={(e) => setAzName(e.target.value)} placeholder="dəyişməsin — boş saxla" />
              <Label>Təsvir (AZ)</Label>
              <Textarea value={azDescription} onChange={(e) => setAzDescription(e.target.value)} placeholder="dəyişməsin — boş saxla" />
            </TabsContent>
            <TabsContent value="en" className="space-y-2">
              <Label>Name (EN)</Label>
              <Input value={enName} onChange={(e) => setEnName(e.target.value)} placeholder="leave empty to keep" />
              <Label>Description (EN)</Label>
              <Textarea value={enDescription} onChange={(e) => setEnDescription(e.target.value)} placeholder="leave empty to keep" />
            </TabsContent>
            <TabsContent value="ru" className="space-y-2">
              <Label>Название (RU)</Label>
              <Input value={ruName} onChange={(e) => setRuName(e.target.value)} placeholder="оставьте пустым" />
              <Label>Описание (RU)</Label>
              <Textarea value={ruDescription} onChange={(e) => setRuDescription(e.target.value)} placeholder="оставьте пустым" />
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label>Kateqoriya</Label>
            <Select
              value={categoryId}
              onValueChange={(val) => {
                if (!val) return; // Radix boş value atır — dəyəri sıfırlamasın
                setCategoryId(val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="dəyişməsin" />
              </SelectTrigger>
              <SelectContent>
                {dedupedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.azName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryId && (
              <label className="flex items-start gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-stone-900"
                  checked={applyPerBranch}
                  onChange={(e) => setApplyPerBranch(e.target.checked)}
                />
                <span>Hər filialda ad üzrə tətbiq et (yoxdursa yarat)</span>
              </label>
            )}
            {categoryId && (
              <p className="text-xs text-amber-600">
                {applyPerBranch
                  ? "Seçilmiş itemlər hər öz filialındakı eyni adlı kateqoriyaya köçürüləcək; o filialda yoxdursa yaradılacaq. İtemin filialı dəyişmir."
                  : "Seçilmiş itemlər bu konkret kateqoriyaya köçürüləcək. Filial-spesifik kateqoriyaya yalnız həmin filialın itemləri köçür."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Hazırlıq (dəq)</Label>
              <Input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="—" />
            </div>
            <div className="space-y-1.5">
              <Label>Qiymət</Label>
              <Input
                type="number" step="0.01" min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="dəyişməsin"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Endirimli</Label>
              <Input
                type="number" step="0.01" min="0"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="dəyişməsin"
              />
            </div>
          </div>
          {(price.trim() || discountPrice.trim()) && (
            <p className="text-xs text-amber-600">
              Diqqət: qiymət BÜTÜN seçilmiş itemlərə (bütün filiallarda) tətbiq olunacaq.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Şəkillər</Label>
            <ImageUpload files={files} onChange={setFiles} maxFiles={5} />
            {files.length > 0 && (
              <p className="text-xs text-amber-600">
                Seçilmiş itemlərin bütün köhnə şəkilləri bu şəkillərlə əvəz olunacaq.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tərkib videosu (mp4/webm)</Label>
            <Input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                className="size-4 accent-stone-900"
                checked={removeVideo}
                onChange={(e) => setRemoveVideo(e.target.checked)}
              />
              Mövcud videoları sil
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Ləğv et
          </Button>
          <Button onClick={handleSubmit} disabled={bulkMutation.isPending}>
            {bulkMutation.isPending ? "Yenilənir..." : "Tətbiq et"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
