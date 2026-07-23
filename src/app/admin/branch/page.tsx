"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiUpload, FiX, FiVideo, FiImage } from "react-icons/fi";
import {
  listBranches,
  getBranchAdmin,
  updateBranch,
  uploadBranchImage,
  uploadBannerVideo,
} from "@/lib/api/admin";
import { getMediaUrl } from "@/lib/api/client";
import { ZoomableImage } from "@/components/admin/ZoomableImage";
import type { AdminBranch } from "@/types/api";

type BannerMode = "video" | "images";

export default function BranchAdminPage() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";

  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [current, setCurrent] = useState<AdminBranch | null>(null);

  // Editable form state
  const [bgColor, setBgColor] = useState("");
  const [fgColor, setFgColor] = useState("");
  const [bannerMode, setBannerMode] = useState<BannerMode>("images");
  const [bannerVideoUrl, setBannerVideoUrl] = useState<string | null>(null);
  const [bannerVideoPosterUrl, setBannerVideoPosterUrl] = useState<string | null>(null);
  const [bannerVideoFileName, setBannerVideoFileName] = useState<string | null>(null);
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [announcementAz, setAnnouncementAz] = useState("");
  const [announcementEn, setAnnouncementEn] = useState("");
  const [announcementRu, setAnnouncementRu] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [announcementFontSize, setAnnouncementFontSize] = useState("");
  const [defaultMenuView, setDefaultMenuView] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingList(true);
    listBranches(token)
      .then((res) => {
        setBranches(res);
        if (res.length > 0 && !selectedId) {
          setSelectedId(String(res[0].id));
        }
      })
      .catch(() => toast.error("Filiallar yüklənmədi"))
      .finally(() => setLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load selected branch detail
  useEffect(() => {
    if (!token || !selectedId) return;
    getBranchAdmin(token, Number(selectedId))
      .then((b) => {
        setCurrent(b);
        setBgColor(b.backgroundColor || "");
        setFgColor(b.foregroundColor || "");
        setBannerVideoUrl(b.bannerVideoUrl || null);
        setBannerVideoPosterUrl(b.bannerVideoPosterUrl || null);
        setBannerVideoFileName(b.bannerVideoFileName || null);
        let imgs: string[] = [];
        if (b.bannerImagesJson) {
          try { imgs = JSON.parse(b.bannerImagesJson) as string[]; } catch { imgs = []; }
        }
        setBannerImages(imgs);
        setBannerMode(b.bannerVideoUrl ? "video" : "images");
        setAnnouncementAz(b.announcementAz || "");
        setAnnouncementEn(b.announcementEn || "");
        setAnnouncementRu(b.announcementRu || "");
        setMetaTitle(b.metaTitle || "");
        setMetaDescription(b.metaDescription || "");
        setAnnouncementFontSize(
          b.announcementFontSize != null ? String(b.announcementFontSize) : ""
        );
        setDefaultMenuView(b.defaultMenuView || "");
      })
      .catch(() => toast.error("Filial məlumatı alınmadı"));
  }, [token, selectedId]);

  const handleVideoFile = useCallback(
    async (file: File) => {
      if (!token) return;
      setUploadingVideo(true);
      try {
        const res = await uploadBannerVideo(token, file);
        setBannerVideoUrl(res.videoUrl);
        setBannerVideoPosterUrl(res.posterUrl);
        setBannerVideoFileName(res.videoFileName);
        toast.success("Video yükləndi");
      } catch {
        toast.error("Video yüklənmədi");
      } finally {
        setUploadingVideo(false);
      }
    },
    [token]
  );

  const handleImagesFile = useCallback(
    async (files: FileList) => {
      if (!token) return;
      setUploadingImage(true);
      try {
        const next = [...bannerImages];
        for (const f of Array.from(files)) {
          const r = await uploadBranchImage(token, f);
          next.push(r.url);
        }
        setBannerImages(next);
        toast.success("Şəkil(lər) yükləndi");
      } catch {
        toast.error("Şəkil yüklənmədi");
      } finally {
        setUploadingImage(false);
      }
    },
    [token, bannerImages]
  );

  const removeImage = (idx: number) =>
    setBannerImages((arr) => arr.filter((_, i) => i !== idx));

  const moveImage = (idx: number, dir: -1 | 1) => {
    setBannerImages((arr) => {
      const next = [...arr];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return arr;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    if (!token || !current) return;
    setSaving(true);
    try {
      // Banner mode "video" seçilsə image array sıfırlanır, əksinə video.
      const payload =
        bannerMode === "video"
          ? {
              backgroundColor: bgColor || null,
              foregroundColor: fgColor || null,
              bannerVideoUrl: bannerVideoUrl ?? "",
              bannerVideoPosterUrl: bannerVideoPosterUrl ?? "",
              bannerVideoFileName: bannerVideoFileName ?? "",
              bannerImagesJson: "",
              announcementAz,
              announcementEn,
              announcementRu,
              metaTitle,
              metaDescription,
              // 0 → sil, dəyər → 10-40 clamp backend-də; "" → sil
              announcementFontSize: announcementFontSize ? Number(announcementFontSize) : 0,
              defaultMenuView,
            }
          : {
              backgroundColor: bgColor || null,
              foregroundColor: fgColor || null,
              bannerVideoUrl: "",
              bannerVideoPosterUrl: "",
              bannerVideoFileName: "",
              bannerImagesJson: JSON.stringify(bannerImages),
              announcementAz,
              announcementEn,
              announcementRu,
              metaTitle,
              metaDescription,
              // 0 → sil, dəyər → 10-40 clamp backend-də; "" → sil
              announcementFontSize: announcementFontSize ? Number(announcementFontSize) : 0,
              defaultMenuView,
            };
      await updateBranch(token, current.id, payload);
      toast.success("Yadda saxlanıldı");
    } catch {
      toast.error("Yadda saxlanılmadı");
    } finally {
      setSaving(false);
    }
  }, [
    token,
    current,
    bannerMode,
    bgColor,
    fgColor,
    bannerVideoUrl,
    bannerVideoPosterUrl,
    bannerVideoFileName,
    bannerImages,
    announcementAz,
    announcementEn,
    announcementRu,
    announcementFontSize,
    defaultMenuView,
    metaTitle,
    metaDescription,
  ]);

  const branchOptions = useMemo(
    () => branches.map((b) => ({ id: String(b.id), label: b.name + (b.slug ? ` (${b.slug})` : "") })),
    [branches]
  );

  if (loadingList) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Filial</h1>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filial seç" />
          </SelectTrigger>
          <SelectContent>
            {branchOptions.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Colors */}
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Rənglər</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fon (background)</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bgColor || "#fafaf9"}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#fafaf9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Yazı (foreground)</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={fgColor || "#1c1917"}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border"
              />
              <Input
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                placeholder="#1c1917"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Banner</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={bannerMode === "video" ? "default" : "outline"}
            onClick={() => setBannerMode("video")}
          >
            <FiVideo className="mr-2" /> Video
          </Button>
          <Button
            type="button"
            variant={bannerMode === "images" ? "default" : "outline"}
            onClick={() => setBannerMode("images")}
          >
            <FiImage className="mr-2" /> Şəkil slideshow
          </Button>
        </div>

        {bannerMode === "video" ? (
          <div className="space-y-3">
            {bannerVideoUrl && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {bannerVideoPosterUrl ? (
                  <img
                    src={getMediaUrl(bannerVideoPosterUrl)}
                    alt="poster"
                    className="aspect-[16/9] w-full rounded-lg object-cover"
                  />
                ) : (
                  <video
                    src={getMediaUrl(bannerVideoUrl)}
                    muted
                    playsInline
                    className="aspect-[16/9] w-full rounded-lg object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => {
                    setBannerVideoUrl(null);
                    setBannerVideoPosterUrl(null);
                    setBannerVideoFileName(null);
                  }}
                >
                  <FiX className="mr-1" /> Sil
                </Button>
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 p-6 text-sm text-stone-500 hover:bg-stone-50">
              <FiUpload />
              {uploadingVideo ? "Yüklənir..." : "Video seç (MP4 / MOV / WEBM)"}
              <input
                type="file"
                accept="video/*"
                hidden
                disabled={uploadingVideo}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {bannerImages.map((url, idx) => (
                <div key={idx} className="group relative">
                  <ZoomableImage
                    src={getMediaUrl(url)}
                    alt=""
                    className="aspect-[16/9] w-full rounded-lg object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-between gap-1 bg-black/40 p-1 opacity-0 transition group-hover:opacity-100">
                    <div className="pointer-events-auto flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={idx === bannerImages.length - 1}
                        onClick={() => moveImage(idx, 1)}
                      >
                        ↓
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="pointer-events-auto"
                      onClick={() => removeImage(idx)}
                    >
                      <FiX />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 p-6 text-sm text-stone-500 hover:bg-stone-50">
              <FiUpload />
              {uploadingImage ? "Yüklənir..." : "Şəkil(lər) seç"}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={uploadingImage}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleImagesFile(e.target.files);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}
      </section>

      {/* Announcement */}
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">
          Elan (menyu səhifəsinin yuxarısında görsənir)
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>AZ</Label>
            <Textarea
              value={announcementAz}
              onChange={(e) => setAnnouncementAz(e.target.value)}
              placeholder="məs. 10% servis haqqı"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>EN</Label>
            <Textarea
              value={announcementEn}
              onChange={(e) => setAnnouncementEn(e.target.value)}
              placeholder="e.g. 10% service charge"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>RU</Label>
            <Textarea
              value={announcementRu}
              onChange={(e) => setAnnouncementRu(e.target.value)}
              placeholder="например 10% сервисный сбор"
              rows={3}
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:max-w-xs">
          <Label>Elan şrift ölçüsü (px)</Label>
          <Input
            type="number"
            min={10}
            max={40}
            value={announcementFontSize}
            onChange={(e) => setAnnouncementFontSize(e.target.value)}
            placeholder="məs. 14"
          />
          <p className="text-xs text-stone-500">
            Elan yazısının ölçüsü (10–40 px). Boş = standart.
          </p>
        </div>
      </section>

      {/* Menyu görünüşü */}
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Menyu görünüşü</h2>
        <div className="space-y-1.5 sm:max-w-xs">
          <Label>Default görünüş</Label>
          <select
            value={defaultMenuView}
            onChange={(e) => setDefaultMenuView(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Standart (tenant ayarı)</option>
            <option value="grid">Şəbəkə (Grid)</option>
            <option value="list">Siyahı (List)</option>
          </select>
          <p className="text-xs text-stone-500">
            Bu filialın menyu səhifəsi ilk açılanda hansı görünüşdə olsun. Ziyarətçi yenə dəyişə
            bilər.
          </p>
        </div>
      </section>

      {/* Link preview (paylaşım) */}
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">
          Link preview (paylaşım)
        </h2>
        <p className="text-xs text-stone-500">
          Link paylaşılanda görünən başlıq və təsvir. Boş buraxılsa avtomatik (filial adı /
          restoran təsviri) istifadə olunur.
        </p>
        <div className="space-y-1.5">
          <Label>Başlıq (title)</Label>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="məs. Ruin Restaurant — Bakı"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Təsvir (description)</Label>
          <Textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="məs. Şəhərin mərkəzində müasir mətbəx. Rezervasiya üçün zəng edin."
            rows={3}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !current}>
          {saving ? "Yadda saxlanılır..." : "Yadda saxla"}
        </Button>
      </div>
    </div>
  );
}
