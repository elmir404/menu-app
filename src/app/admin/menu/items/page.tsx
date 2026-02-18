"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useMenuItems, useDeleteMenuItem } from "@/hooks/use-menu-items";
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
import { getMediaUrl } from "@/lib/api/client";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

export default function MenuItemsPage() {
  const { data: session } = useSession();
  const { data: menuItems, isLoading } = useMenuItems();
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteMenuItem();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const tenantId = session?.tenantId ?? 0;
  const tenantCategories = (categories ?? []).filter(
    (c) => c.tenantId === tenantId
  );
  const tenantCategoryIds = new Set(tenantCategories.map((c) => c.id));

  const filtered = (menuItems ?? [])
    .filter((item) => tenantCategoryIds.has(item.menuCategoryId))
    .filter((item) =>
      item.azName.toLowerCase().includes(search.toLowerCase()) ||
      item.enName.toLowerCase().includes(search.toLowerCase())
    )
    .filter((item) =>
      categoryFilter === "all"
        ? true
        : item.menuCategoryId === Number(categoryFilter)
    );

  const getCategoryName = (categoryId: number) => {
    const cat = tenantCategories.find((c) => c.id === categoryId);
    return cat?.azName || "-";
  };

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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kateqoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hamısı</SelectItem>
            {tenantCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.azName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Şəkil</TableHead>
                <TableHead>Ad (AZ)</TableHead>
                <TableHead>Qiymət</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-stone-500">
                    Item tapılmadı
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const thumb =
                    item.menuItemImages?.[0]?.path
                      ? getMediaUrl(item.menuItemImages[0].path)
                      : null;
                  return (
                    <TableRow key={item.id}>
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
                        {item.currencySign}{item.price}
                        {item.discountPrice > 0 && (
                          <span className="ml-1 text-xs text-emerald-600">
                            → {item.currencySign}{item.discountPrice}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryName(item.menuCategoryId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Yenilə"
                          >
                            <Link href={`/admin/menu/items/${item.id}`}>
                              <FiEdit2 className="text-stone-600" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
