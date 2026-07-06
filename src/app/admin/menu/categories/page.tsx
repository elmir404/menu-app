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
import { BranchScopeSelect } from "@/components/admin/BranchScopeSelect";
import {
  useBranchScope,
  matchesBranchScope,
  scopeToBranchId,
} from "@/contexts/BranchScopeContext";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
  draggable,
}: {
  cat: AdminMenuCategory;
  onDelete: (id: number) => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id, disabled: !draggable });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "#f5f5f4" : undefined,
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell
        className={`w-10 touch-none ${draggable ? "cursor-grab" : "cursor-not-allowed"}`}
        {...(draggable ? attributes : {})}
        {...(draggable ? listeners : {})}
      >
        <GripVertical
          className={`size-4 ${draggable ? "text-stone-400" : "text-stone-200"}`}
        />
      </TableCell>
      <TableCell className="font-mono text-xs">{cat.id}</TableCell>
      <TableCell>{cat.azName}</TableCell>
      <TableCell>{cat.enName}</TableCell>
      <TableCell>{cat.ruName}</TableCell>
      <TableCell>
        <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          {cat.branchName ?? "Ümumi"}
        </span>
      </TableCell>
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
  const { data: categories, isLoading } = useCategories(session?.tenantId || undefined);
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  const { scope, setScope, locked } = useBranchScope();
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
      .filter((c) => matchesBranchScope(c.branchId, scope))
      .filter(
        (c) =>
          c.azName.toLowerCase().includes(search.toLowerCase()) ||
          c.enName.toLowerCase().includes(search.toLowerCase()) ||
          c.ruName.toLowerCase().includes(search.toLowerCase())
      );
  }, [categories, tenantId, scope, search]);

  // Reorder yalnız tək filial scope-unda (Hamısı = qarışıq branch-lər; backend tək branchId gözləyir)
  const dragEnabled = scope !== "all";

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
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !dragEnabled) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      // Seçilmiş filial scope-u üzrə sortOrder təyin olunur (null = Ümumi/tenant-wide).
      await reorderMutation.mutateAsync({
        tenantId,
        branchId: scopeToBranchId(scope),
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <BranchScopeSelect
          value={scope}
          onChange={setScope}
          includeAll
          disabled={locked}
        />
        {!dragEnabled && (
          <p className="self-center text-xs text-stone-500">
            Sıralamaq üçün bir filial seç
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>AZ</TableHead>
                <TableHead>EN</TableHead>
                <TableHead>RU</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-stone-500">
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
                      <SortableRow
                        key={cat.id}
                        cat={cat}
                        onDelete={setDeleteId}
                        draggable={dragEnabled}
                      />
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
