"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  useCategories,
  useDeleteCategory,
  useReorderCategories,
} from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AdminMenuCategory } from "@/types/api";

function SortableRow({
  cat,
  onDelete,
}: {
  cat: AdminMenuCategory;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "#f5f5f4" : undefined,
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="size-4 text-stone-400" />
      </TableCell>
      <TableCell className="font-mono text-xs">{cat.id}</TableCell>
      <TableCell>{cat.azName}</TableCell>
      <TableCell>{cat.enName}</TableCell>
      <TableCell>{cat.ruName}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/menu/categories/${cat.id}`}>
              <FiEdit2 className="text-stone-600" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(cat.id)}
          >
            <FiTrash2 className="text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [items, setItems] = useState<AdminMenuCategory[]>([]);

  const tenantId = session?.tenantId ?? 0;

  const filtered = useMemo(() => {
    return (categories ?? [])
      .filter((c) => {
        if (!tenantId || tenantId === 0) return true;
        return c.tenantId === tenantId;
      })
      .filter(
        (c) =>
          c.azName.toLowerCase().includes(search.toLowerCase()) ||
          c.enName.toLowerCase().includes(search.toLowerCase()) ||
          c.ruName.toLowerCase().includes(search.toLowerCase())
      );
  }, [categories, tenantId, search]);

  // Sync local state with filtered (so drag works on the visible list)
  useEffect(() => {
    setItems(filtered);
  }, [filtered]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Kateqoriya silindi");
      setDeleteId(null);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      // Bütün branch null kateqoriyalar tenant səviyyəsindədir; branch-spesifik
      // olanlar üçün admin filtri yoxdur (menu-app session-da branchId yoxdur).
      // Backend tenant-scope üzərində sortOrder təyin edir.
      await reorderMutation.mutateAsync({
        tenantId,
        items: next.map((c, idx) => ({ id: c.id, sortOrder: idx })),
      });
      toast.success("Sıralama yeniləndi");
    } catch {
      toast.error("Sıralama yenilənmədi");
      setItems(filtered); // rollback
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Kateqoriyalar</h1>
        <Button asChild>
          <Link href="/admin/menu/categories/new">
            <FiPlus className="mr-2" />
            Yeni kateqoriya
          </Link>
        </Button>
      </div>

      <Input
        placeholder="Axtar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>AZ</TableHead>
                <TableHead>EN</TableHead>
                <TableHead>RU</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-stone-500">
                    Kateqoriya tapılmadı
                  </TableCell>
                </TableRow>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((cat) => (
                      <SortableRow key={cat.id} cat={cat} onDelete={setDeleteId} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Kateqoriyanı sil"
        description="Bu kateqoriyanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
