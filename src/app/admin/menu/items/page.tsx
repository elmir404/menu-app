"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useMenuItems,
  useDeleteMenuItem,
  useReorderMenuItems,
} from "@/hooks/use-menu-items";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getMediaUrl } from "@/lib/api/client";
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
import type { AdminMenuItem, AdminMenuCategory } from "@/types/api";
import type { BranchScope } from "@/contexts/BranchScopeContext";

// Filiala uyğun kateqoriyalar: konkret filial → o filial + Ümumi(null); Ümumi/Hamısı → null
function categoriesForScope(
  categories: AdminMenuCategory[],
  scope: BranchScope
): AdminMenuCategory[] {
  if (scope === "none") return categories.filter((c) => c.branchId == null);
  if (scope === "all") return categories;
  return categories.filter((c) => c.branchId == null || c.branchId === scope);
}

function SortableRow({
  item,
  thumb,
  categoryName,
  branchName,
  onDelete,
  draggable,
}: {
  item: AdminMenuItem;
  thumb: string | null;
  categoryName: string;
  branchName: string;
  onDelete: (id: number) => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !draggable });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "#f5f5f4" : undefined,
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell
        className={`w-10 ${draggable ? "cursor-grab" : "cursor-not-allowed"}`}
        {...(draggable ? attributes : {})}
        {...(draggable ? listeners : {})}
      >
        <GripVertical
          className={`size-4 ${draggable ? "text-stone-400" : "text-stone-200"}`}
        />
      </TableCell>
      <TableCell>
        {thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumb}
            alt={item.azName}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-stone-100 text-xs text-stone-400">
            N/A
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{item.azName}</TableCell>
      <TableCell>
        {item.currencySign}
        {item.price}
        {item.discountPrice > 0 && (
          <span className="ml-1 text-xs text-emerald-600">
            → {item.currencySign}
            {item.discountPrice}
          </span>
        )}
      </TableCell>
      <TableCell>{categoryName}</TableCell>
      <TableCell>
        <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          {branchName}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild title="Yenilə">
            <Link href={`/admin/menu/items/${item.id}`}>
              <FiEdit2 className="text-stone-600" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
          >
            <FiTrash2 className="text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function MenuItemsPage() {
  const { data: session } = useSession();
  const { data: menuItems, isLoading } = useMenuItems();
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteMenuItem();
  const reorderMutation = useReorderMenuItems();
  const { scope, setScope, locked } = useBranchScope();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [items, setItems] = useState<AdminMenuItem[]>([]);

  const tenantId = session?.tenantId ?? 0;

  const tenantCategories = useMemo(
    () =>
      (categories ?? []).filter((c) => {
        if (!tenantId || tenantId === 0) return true;
        return c.tenantId === tenantId;
      }),
    [categories, tenantId]
  );
  const tenantCategoryIds = useMemo(
    () => new Set(tenantCategories.map((c) => c.id)),
    [tenantCategories]
  );
  // Kateqoriya filter dropdownu seçilmiş filiala uyğun süzülür (o filial + Ümumi)
  const scopedCategories = useMemo(
    () => categoriesForScope(tenantCategories, scope),
    [tenantCategories, scope]
  );

  // Filial dəyişəndə seçili kateqoriya artıq scope-da yoxdursa filteri sıfırla
  useEffect(() => {
    if (
      categoryFilter !== "all" &&
      !scopedCategories.some((c) => String(c.id) === categoryFilter)
    ) {
      setCategoryFilter("all");
    }
  }, [scopedCategories, categoryFilter]);

  const filtered = useMemo(
    () =>
      (menuItems ?? [])
        .filter((item) =>
          tenantCategoryIds.size === 0
            ? true
            : tenantCategoryIds.has(item.menuCategoryId)
        )
        .filter((item) => matchesBranchScope(item.branchId, scope))
        .filter(
          (item) =>
            item.azName.toLowerCase().includes(search.toLowerCase()) ||
            item.enName.toLowerCase().includes(search.toLowerCase())
        )
        .filter((item) =>
          categoryFilter === "all"
            ? true
            : item.menuCategoryId === Number(categoryFilter)
        ),
    [menuItems, tenantCategoryIds, scope, search, categoryFilter]
  );

  useEffect(() => {
    setItems(filtered);
  }, [filtered]);

  // Drag yalnız tək kateqoriya VƏ tək filial scope seçildikdə aktiv (qarışıq
  // kateqoriya/filial üzrə cross-reorder backend tərəfindən qadağandır).
  const dragEnabled = categoryFilter !== "all" && scope !== "all";
  const activeCategoryId = dragEnabled ? Number(categoryFilter) : null;

  const getCategoryName = (categoryId: number) => {
    const cat = tenantCategories.find((c) => c.id === categoryId);
    return cat?.azName || "-";
  };

  const getBranchName = (item: AdminMenuItem) => item.branchName ?? "Ümumi";

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Menyu itemi silindi");
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
    if (!over || active.id === over.id || activeCategoryId === null) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    try {
      await reorderMutation.mutateAsync({
        tenantId,
        branchId: scopeToBranchId(scope),
        menuCategoryId: activeCategoryId,
        items: next.map((i, idx) => ({ id: i.id, sortOrder: idx })),
      });
      toast.success("Sıralama yeniləndi");
    } catch {
      toast.error("Sıralama yenilənmədi");
      setItems(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Menyu itemləri</h1>
        <Button asChild>
          <Link href="/admin/menu/items/new">
            <FiPlus className="mr-2" />
            Yeni item
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kateqoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hamısı (sıralama deaktiv)</SelectItem>
            {scopedCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.azName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!dragEnabled && (
          <p className="self-center text-xs text-stone-500">
            Sıralamaq üçün bir kateqoriya seç
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
                <TableHead>Şəkil</TableHead>
                <TableHead>Ad (AZ)</TableHead>
                <TableHead>Qiymət</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-stone-500">
                    Item tapılmadı
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
                    {items.map((item) => {
                      const thumb = item.menuItemImages?.[0]?.path
                        ? getMediaUrl(item.menuItemImages[0].path)
                        : null;
                      return (
                        <SortableRow
                          key={item.id}
                          item={item}
                          thumb={thumb}
                          categoryName={getCategoryName(item.menuCategoryId)}
                          branchName={getBranchName(item)}
                          onDelete={setDeleteId}
                          draggable={dragEnabled}
                        />
                      );
                    })}
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
        title="Menyu itemini sil"
        description="Bu itemi silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
