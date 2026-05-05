"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useLinks,
  useAddLink,
  useUpdateLink,
  useDeleteLink,
  useReorderLinks,
} from "@/hooks/use-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LinkIcon, ICON_OPTIONS, type IconKey } from "@/components/LinkIcon";
import { FiEdit2, FiPlus, FiTrash2, FiLink, FiMenu } from "react-icons/fi";
import type { TenantLink } from "@/types/api";

const linkSchema = z.object({
  azTitle: z.string().min(1, "Az başlıq tələb olunur"),
  enTitle: z.string().optional(),
  ruTitle: z.string().optional(),
  url: z.string().min(1, "URL tələb olunur"),
  iconKey: z.string().min(1, "İkon seçin"),
  openInNewTab: z.boolean(),
});

type LinkFormData = z.infer<typeof linkSchema>;

export default function LinksPage() {
  const { data: session } = useSession();
  const tenantId = session?.tenantId ?? 0;
  const { data: linksData, isLoading } = useLinks();
  const addMutation = useAddLink();
  const updateMutation = useUpdateLink();
  const deleteMutation = useDeleteLink();
  const reorderMutation = useReorderLinks();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<TenantLink | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [items, setItems] = useState<TenantLink[]>([]);

  useEffect(() => {
    setItems(
      [...(linksData ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }, [linksData]);

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addForm = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      azTitle: "",
      enTitle: "",
      ruTitle: "",
      url: "",
      iconKey: "link",
      openInNewTab: true,
    },
  });

  const editForm = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  const handleAdd = async (data: LinkFormData) => {
    try {
      await addMutation.mutateAsync({
        tenantId,
        azTitle: data.azTitle,
        enTitle: data.enTitle || null,
        ruTitle: data.ruTitle || null,
        url: data.url,
        iconKey: data.iconKey,
        openInNewTab: data.openInNewTab,
        sortOrder: items.length,
      });
      toast.success("Link əlavə edildi");
      addForm.reset();
      setShowAdd(false);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const handleEdit = async (data: LinkFormData) => {
    if (!editItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        tenantId,
        azTitle: data.azTitle,
        enTitle: data.enTitle || null,
        ruTitle: data.ruTitle || null,
        url: data.url,
        iconKey: data.iconKey,
        openInNewTab: data.openInNewTab,
        sortOrder: editItem.sortOrder,
        isActive: editItem.isActive,
      });
      toast.success("Link yeniləndi");
      setEditItem(null);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Link silindi");
      setDeleteId(null);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const openEdit = (link: TenantLink) => {
    setEditItem(link);
    editForm.reset({
      azTitle: link.azTitle,
      enTitle: link.enTitle ?? "",
      ruTitle: link.ruTitle ?? "",
      url: link.url,
      iconKey: link.iconKey ?? "link",
      openInNewTab: link.openInNewTab,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({
      ...it,
      sortOrder: idx,
    }));
    setItems(reordered);

    reorderMutation
      .mutateAsync({
        tenantId,
        items: reordered.map((it) => ({ id: it.id, sortOrder: it.sortOrder })),
      })
      .catch(() => {
        toast.error("Sıralama saxlanmadı");
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Linklər</h1>
          <p className="mt-1 text-sm text-stone-500">
            Restoran səhifəsində göstəriləcək linklər. Sürükləyərək sıralayın.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <FiPlus className="mr-2" />
          Yeni link
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FiLink className="mb-3 text-4xl text-stone-300" />
            <p className="text-sm text-stone-500">Hələ link yoxdur</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((link) => (
                <SortableRow
                  key={link.id}
                  link={link}
                  onEdit={() => openEdit(link)}
                  onDelete={() => setDeleteId(link.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni link</DialogTitle>
          </DialogHeader>
          <LinkForm
            form={addForm}
            onSubmit={handleAdd}
            submitting={addMutation.isPending}
            submitLabel="Əlavə et"
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editItem !== null}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link redaktə et</DialogTitle>
          </DialogHeader>
          <LinkForm
            form={editForm}
            onSubmit={handleEdit}
            submitting={updateMutation.isPending}
            submitLabel="Yenilə"
            onCancel={() => setEditItem(null)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Linki sil"
        description="Bu linki silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function SortableRow({
  link,
  onEdit,
  onDelete,
}: {
  link: TenantLink;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-stone-400 hover:bg-stone-100 active:cursor-grabbing"
          aria-label="Sürüklə"
        >
          <FiMenu />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600">
          <LinkIcon iconKey={link.iconKey} className="text-base" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-900">
            {link.azTitle}
          </p>
          <p className="truncate text-xs text-stone-500">{link.url}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <FiEdit2 className="text-stone-500" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <FiTrash2 className="text-red-500" />
        </Button>
      </div>
    </li>
  );
}

function LinkForm({
  form,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
}: {
  form: ReturnType<typeof useForm<LinkFormData>>;
  onSubmit: (data: LinkFormData) => void;
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  const iconKey = form.watch("iconKey");
  const openInNewTab = form.watch("openInNewTab");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>İkon</Label>
        <Select
          value={iconKey}
          onValueChange={(v) => form.setValue("iconKey", v as IconKey)}
        >
          <SelectTrigger>
            <SelectValue placeholder="İkon seçin" />
          </SelectTrigger>
          <SelectContent>
            {ICON_OPTIONS.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                <span className="flex items-center gap-2">
                  <LinkIcon iconKey={opt.key} className="text-base" />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Başlıq (AZ)</Label>
        <Input {...form.register("azTitle")} placeholder="Menyu" />
        {form.formState.errors.azTitle && (
          <p className="text-xs text-red-500">
            {form.formState.errors.azTitle.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Başlıq (EN)</Label>
          <Input {...form.register("enTitle")} placeholder="Menu" />
        </div>
        <div className="space-y-2">
          <Label>Başlıq (RU)</Label>
          <Input {...form.register("ruTitle")} placeholder="Меню" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          {...form.register("url")}
          placeholder="https://example.com/menu"
        />
        {form.formState.errors.url && (
          <p className="text-xs text-red-500">
            {form.formState.errors.url.message}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={openInNewTab}
          onChange={(e) => form.setValue("openInNewTab", e.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        Yeni vərəqdə aç
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Ləğv et
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saxlanılır..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
