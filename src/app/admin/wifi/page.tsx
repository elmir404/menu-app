"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  useWifi,
  useAddWifi,
  useUpdateWifi,
  useDeleteWifi,
} from "@/hooks/use-wifi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FiEdit2, FiPlus, FiTrash2, FiWifi } from "react-icons/fi";
import type { WifiInfo } from "@/types/api";

const wifiSchema = z.object({
  ssid: z.string().min(1, "SSID tələb olunur"),
  password: z.string().min(1, "Şifrə tələb olunur"),
});

type WifiFormData = z.infer<typeof wifiSchema>;

export default function WifiPage() {
  const { data: session } = useSession();
  const { data: wifiList, isLoading } = useWifi();
  const addMutation = useAddWifi();
  const updateMutation = useUpdateWifi();
  const deleteMutation = useDeleteWifi();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<WifiInfo | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const tenantId = session?.tenantId ?? 0;

  // Add form
  const addForm = useForm<WifiFormData>({
    resolver: zodResolver(wifiSchema),
  });

  // Edit form
  const editForm = useForm<WifiFormData>({
    resolver: zodResolver(wifiSchema),
  });

  const handleAdd = async (data: WifiFormData) => {
    try {
      await addMutation.mutateAsync({ ...data, tenantId });
      toast.success("WiFi əlavə edildi");
      addForm.reset();
      setShowAdd(false);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const handleEdit = async (data: WifiFormData) => {
    if (!editItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        ...data,
        tenantId,
      });
      toast.success("WiFi yeniləndi");
      setEditItem(null);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("WiFi silindi");
      setDeleteId(null);
    } catch {
      toast.error("Xəta baş verdi");
    }
  };

  const openEdit = (wifi: WifiInfo) => {
    setEditItem(wifi);
    editForm.reset({ ssid: wifi.ssid, password: wifi.password });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">WiFi idarəetmə</h1>
        <Button onClick={() => setShowAdd(true)}>
          <FiPlus className="mr-2" />
          Yeni WiFi
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (wifiList ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FiWifi className="mb-3 text-4xl text-stone-300" />
            <p className="text-sm text-stone-500">WiFi şəbəkəsi yoxdur</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(wifiList ?? []).map((wifi) => (
            <Card key={wifi.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FiWifi className="text-stone-400" />
                  {wifi.ssid}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(wifi)}
                  >
                    <FiEdit2 className="text-stone-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(wifi.id)}
                  >
                    <FiTrash2 className="text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-stone-500">Şifrə</p>
                <p className="font-mono text-sm text-stone-900">
                  {wifi.password}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni WiFi əlavə et</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
            <div className="space-y-2">
              <Label>SSID (şəbəkə adı)</Label>
              <Input {...addForm.register("ssid")} placeholder="Restaurant-WiFi" />
              {addForm.formState.errors.ssid && (
                <p className="text-xs text-red-500">
                  {addForm.formState.errors.ssid.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Şifrə</Label>
              <Input {...addForm.register("password")} placeholder="wifi123" />
              {addForm.formState.errors.password && (
                <p className="text-xs text-red-500">
                  {addForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Ləğv et
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Əlavə edilir..." : "Əlavə et"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editItem !== null} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WiFi redaktə et</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>SSID (şəbəkə adı)</Label>
              <Input {...editForm.register("ssid")} />
              {editForm.formState.errors.ssid && (
                <p className="text-xs text-red-500">
                  {editForm.formState.errors.ssid.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Şifrə</Label>
              <Input {...editForm.register("password")} />
              {editForm.formState.errors.password && (
                <p className="text-xs text-red-500">
                  {editForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
              >
                Ləğv et
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Yenilənir..." : "Yenilə"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="WiFi-ni sil"
        description="Bu WiFi şəbəkəsini silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
