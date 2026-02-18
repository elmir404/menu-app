"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/use-categories";
import { useMenuItems } from "@/hooks/use-menu-items";
import { useWifi } from "@/hooks/use-wifi";
import { useAdminTenant } from "@/hooks/use-admin-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FiGrid, FiList, FiWifi, FiExternalLink } from "react-icons/fi";

export default function AdminDashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { data: tenantConfig } = useAdminTenant();

  const tenantId = session?.tenantId ?? 0;
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: menuItems, isLoading: itemLoading } = useMenuItems();
  const { data: wifiList, isLoading: wifiLoading } = useWifi();

  if (authStatus === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const tenantCategories = (categories ?? []).filter(
    (c) => c.tenantId === tenantId
  );
  const tenantCategoryIds = new Set(tenantCategories.map((c) => c.id));
  const tenantMenuItems = (menuItems ?? []).filter((item) =>
    tenantCategoryIds.has(item.menuCategoryId)
  );

  const stats = [
    {
      title: "Kateqoriyalar",
      value: catLoading ? "..." : tenantCategories.length,
      icon: FiGrid,
      href: "/admin/menu/categories",
    },
    {
      title: "Menyu itemləri",
      value: itemLoading ? "..." : tenantMenuItems.length,
      icon: FiList,
      href: "/admin/menu/items",
    },
    {
      title: "WiFi şəbəkələri",
      value: wifiLoading ? "..." : (wifiList?.length ?? 0),
      icon: FiWifi,
      href: "/admin/wifi",
    },
  ];

  const tenantSlug = session?.tenantSlug;
  const tenantName = tenantConfig?.name || session?.tenantName || "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500">
            Xoş gəldiniz, {session?.user?.firstName || "Admin"}
            {tenantName && (
              <span className="text-stone-400">
                {" "}
                &middot; {tenantName}
              </span>
            )}
          </p>
        </div>
        {tenantSlug && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/az/${tenantSlug}/menu`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Menyuya bax
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="cursor-pointer transition hover:shadow-md"
              onClick={() => router.push(stat.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-900">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
