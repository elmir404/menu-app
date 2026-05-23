"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FiEdit2 } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LinkIcon, getIconBrandColor } from "@/components/LinkIcon";
import { useMyBranch, useUpdateBranchUrl } from "@/hooks/use-branch";
import type { BranchSocialUrls } from "@/lib/api/admin";

interface SocialField {
  key: keyof BranchSocialUrls;
  label: string;
  iconKey: string;
  placeholder: string;
}

const SOCIAL_FIELDS: SocialField[] = [
  { key: "phone", label: "Telefon", iconKey: "phone", placeholder: "+994551234567" },
  { key: "email", label: "Email", iconKey: "email", placeholder: "info@example.com" },
  { key: "instagramUrl", label: "Instagram", iconKey: "instagram", placeholder: "https://instagram.com/..." },
  { key: "facebookUrl", label: "Facebook", iconKey: "facebook", placeholder: "https://facebook.com/..." },
  { key: "whatsAppUrl", label: "WhatsApp", iconKey: "whatsapp", placeholder: "https://wa.me/..." },
  { key: "telegramUrl", label: "Telegram", iconKey: "telegram", placeholder: "https://t.me/..." },
  { key: "tiktokUrl", label: "TikTok", iconKey: "tiktok", placeholder: "https://tiktok.com/@..." },
  { key: "youtubeUrl", label: "YouTube", iconKey: "youtube", placeholder: "https://youtube.com/..." },
  { key: "twitterUrl", label: "Twitter / X", iconKey: "twitter", placeholder: "https://x.com/..." },
  { key: "linkedInUrl", label: "LinkedIn", iconKey: "linkedin", placeholder: "https://linkedin.com/..." },
  { key: "tripAdvisorUrl", label: "TripAdvisor", iconKey: "link", placeholder: "https://tripadvisor.com/..." },
  { key: "yelpUrl", label: "Yelp", iconKey: "link", placeholder: "https://yelp.com/..." },
  { key: "threadsUrl", label: "Threads", iconKey: "link", placeholder: "https://threads.net/@..." },
  { key: "pinterestUrl", label: "Pinterest", iconKey: "link", placeholder: "https://pinterest.com/..." },
  { key: "websiteUrl", label: "Vebsayt", iconKey: "website", placeholder: "https://..." },
  { key: "locationUrl", label: "Google Maps", iconKey: "location", placeholder: "https://goo.gl/maps/..." },
  { key: "wazeLocationUrl", label: "Waze", iconKey: "waze", placeholder: "https://waze.com/..." },
  { key: "menuUrl", label: "Menyu PDF", iconKey: "menu", placeholder: "https://.../menu.pdf" },
];

export function BranchSocialLinksSection() {
  const { data: branch, isLoading } = useMyBranch();
  const updateMutation = useUpdateBranchUrl();

  const [editField, setEditField] = useState<SocialField | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (f: SocialField) => {
    const current = (branch?.[f.key] as string | null | undefined) ?? "";
    setEditField(f);
    setEditValue(current);
  };

  const handleSave = async () => {
    if (!editField) return;
    try {
      await updateMutation.mutateAsync({
        field: editField.key,
        value: editValue.trim() || null,
      });
      toast.success("URL yeniləndi");
      setEditField(null);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Filial sosial linkləri</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!branch) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Filial sosial linkləri</h2>
        <span className="text-sm text-stone-500">{branch.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SOCIAL_FIELDS.map((f) => {
          const value = (branch[f.key] as string | null | undefined) ?? "";
          const brandColor = getIconBrandColor(f.iconKey);
          return (
            <Card key={f.key as string}>
              <CardContent className="flex items-center gap-3 p-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: brandColor }}
                  aria-hidden="true"
                >
                  <LinkIcon iconKey={f.iconKey} className="text-base" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900">{f.label}</p>
                  <p className="truncate text-xs text-stone-500">{value || "—"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(f)}
                  aria-label={`${f.label} edit`}
                >
                  <FiEdit2 />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={editField !== null} onOpenChange={(o) => !o && setEditField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editField?.label}</DialogTitle>
          </DialogHeader>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={editField?.placeholder}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditField(null)}>
              Ləğv et
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saxlanır..." : "Yadda saxla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
