"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useAdminTenant } from "@/hooks/use-admin-tenant";
import { getMediaUrl } from "@/lib/api/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FiHome,
  FiGrid,
  FiList,
  FiWifi,
  FiImage,
  FiLogOut,
  FiChevronUp,
  FiExternalLink,
} from "react-icons/fi";

const menuItems = [
  { title: "Dashboard", href: "/admin", icon: FiHome },
  { title: "Kateqoriyalar", href: "/admin/menu/categories", icon: FiGrid },
  { title: "Menyu itemləri", href: "/admin/menu/items", icon: FiList },
  { title: "WiFi", href: "/admin/wifi", icon: FiWifi },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: tenantConfig } = useAdminTenant();

  const tenantSlug = session?.tenantSlug || "";
  const tenantName = tenantConfig?.name || session?.tenantName || "";
  const tenantLogo = tenantConfig?.branding?.logoUrl
    ? getMediaUrl(tenantConfig.branding.logoUrl)
    : null;

  const initials = session?.user
    ? `${session.user.firstName?.[0] || ""}${session.user.lastName?.[0] || ""}`
    : "AD";

  const publicMenuUrl = tenantSlug ? `/az/${tenantSlug}/menu` : null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {tenantLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tenantLogo}
                alt={tenantName}
                className="h-7 w-7 rounded object-cover shrink-0"
              />
            ) : tenantName ? (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                style={{
                  backgroundColor:
                    tenantConfig?.branding?.primaryColor || "#1c1917",
                }}
              >
                {tenantName[0]?.toUpperCase()}
              </div>
            ) : null}
            <Link href="/admin" className="text-lg font-bold truncate">
              {tenantName || "Admin Panel"}
            </Link>
          </div>
          <SidebarTrigger className="md:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>İdarəetmə</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {publicMenuUrl && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Menyuya bax</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a
                        href={publicMenuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiExternalLink />
                        <span>Publik menyu</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    {tenantLogo && <AvatarImage src={tenantLogo} />}
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm">
                      {session?.user?.name || "Admin"}
                    </span>
                    {tenantName && (
                      <span className="truncate text-xs text-sidebar-foreground/50">
                        {tenantName}
                      </span>
                    )}
                  </div>
                  <FiChevronUp className="ml-auto shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                {publicMenuUrl && (
                  <>
                    <DropdownMenuItem asChild>
                      <a
                        href={publicMenuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiExternalLink className="mr-2" />
                        Menyuya bax
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-600"
                >
                  <FiLogOut className="mr-2" />
                  Çıxış
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
