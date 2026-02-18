"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
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
import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function CategoriesPage() {
  const { data: session } = useSession();
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const tenantId = session?.tenantId ?? 0;

  const filtered = (categories ?? [])
    .filter((c) => c.tenantId === tenantId)
    .filter(
      (c) =>
        c.azName.toLowerCase().includes(search.toLowerCase()) ||
        c.enName.toLowerCase().includes(search.toLowerCase()) ||
        c.ruName.toLowerCase().includes(search.toLowerCase())
    );

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
                <TableHead>ID</TableHead>
                <TableHead>AZ</TableHead>
                <TableHead>EN</TableHead>
                <TableHead>RU</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-stone-500">
                    Kateqoriya tapılmadı
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-mono text-xs">{cat.id}</TableCell>
                    <TableCell>{cat.azName}</TableCell>
                    <TableCell>{cat.enName}</TableCell>
                    <TableCell>{cat.ruName}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <FiTrash2 className="text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
