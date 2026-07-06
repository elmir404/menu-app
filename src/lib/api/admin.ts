import axios from "axios";
import { authApi, publicApi, unwrap } from "./client";
import type {
  ApiResponse,
  AdminMenuCategory,
  AdminMenuItem,
  TenantConfig,
  WifiInfo,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  CreateMenuItemRequest,
  CreateWifiRequest,
  UpdateWifiRequest,
  TenantLink,
  CreateLinkRequest,
  UpdateLinkRequest,
  ReorderLinksRequest,
  AdminBranch,
  UpdateBranchPatchRequest,
  BannerVideoUploadResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─── Menu Categories ─────────────────────────────────────────────────────────

export async function getCategories(
  token: string,
  tenantId?: number
): Promise<AdminMenuCategory[]> {
  // tenantId: token-də tenant claim olmayan (superadmin) hesablar üçün açıq override —
  // backend parametrsiz sorğuda "Tenant Id təyin olunmayıb" (400) qaytarır.
  const qs = tenantId ? `?tenantId=${tenantId}` : "";
  const { data } = await authApi.get<ApiResponse<AdminMenuCategory[]>>(
    `/api/MenuCategory/List${qs}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function getCategoriesWithItems(
  token: string
): Promise<AdminMenuCategory[]> {
  const { data } = await authApi.get<ApiResponse<AdminMenuCategory[]>>(
    "/api/MenuCategory/GetAllWithItems",
    authHeaders(token)
  );
  return unwrap(data);
}

export async function getCategoryById(
  token: string,
  id: number
): Promise<AdminMenuCategory> {
  const { data } = await authApi.get<ApiResponse<AdminMenuCategory>>(
    `/api/MenuCategory/GetById/${id}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function addCategory(
  token: string,
  body: CreateMenuCategoryRequest
): Promise<AdminMenuCategory> {
  const { data } = await authApi.post<ApiResponse<AdminMenuCategory>>(
    "/api/MenuCategory/Add",
    body,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function updateCategory(
  token: string,
  body: UpdateMenuCategoryRequest
): Promise<AdminMenuCategory> {
  const { data } = await authApi.put<ApiResponse<AdminMenuCategory>>(
    "/api/MenuCategory/Update",
    body,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function deleteCategory(
  token: string,
  id: number
): Promise<void> {
  await authApi.delete(`/api/MenuCategory/Delete/${id}`, authHeaders(token));
}

export interface ReorderMenuRequest {
  tenantId: number;
  branchId?: number | null;
  menuCategoryId?: number;
  items: { id: number; sortOrder: number }[];
}

export async function reorderCategories(
  token: string,
  body: ReorderMenuRequest
): Promise<void> {
  await authApi.post(
    "/api/MenuCategory/Reorder",
    body,
    authHeaders(token)
  );
}

export async function reorderMenuItems(
  token: string,
  body: ReorderMenuRequest
): Promise<void> {
  await authApi.post(
    "/api/MenuItem/Reorder",
    body,
    authHeaders(token)
  );
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

export async function getMenuItems(
  token: string,
  tenantId?: number
): Promise<AdminMenuItem[]> {
  // tenantId: bax getCategories — tenant claim olmayan hesablar üçün override.
  const qs = tenantId ? `?tenantId=${tenantId}` : "";
  const { data } = await authApi.get<ApiResponse<AdminMenuItem[]>>(
    `/api/MenuItem/List${qs}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function getMenuItemsByCategory(
  token: string,
  categoryId: number
): Promise<AdminMenuItem[]> {
  const { data } = await authApi.get<ApiResponse<AdminMenuItem[]>>(
    `/api/MenuItem/GetByCategoryId/${categoryId}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function getMenuItemById(
  token: string,
  id: number
): Promise<AdminMenuItem> {
  const { data } = await authApi.get<ApiResponse<AdminMenuItem>>(
    `/api/MenuItem/GetById/${id}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function getMenuItemByIdWithDetails(
  token: string,
  id: number
): Promise<AdminMenuItem> {
  const { data } = await authApi.get<ApiResponse<AdminMenuItem>>(
    `/api/MenuItem/GetByIdWithDetails/${id}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function addMenuItem(
  token: string,
  formData: FormData
): Promise<AdminMenuItem> {
  // ⚠️ FormData göndərəndə authApi instance-ının default "Content-Type: application/json"
  // header-i problemi yaradır. Bunun əvəzinə birbaşa axios.post istifadə edirik
  // ki, FormData üçün avtomatik "multipart/form-data; boundary=..." header-i set olunsun
  
  const response = await axios.post<ApiResponse<AdminMenuItem>>(
    `${API_BASE_URL}/api/MenuItem/Add`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type header-i burada YOXDUR — axios FormData üçün avtomatik set edəcək
        // "multipart/form-data; boundary=..." formatında
      },
    }
  );
  
  return unwrap(response.data);
}

export async function updateMenuItem(
  token: string,
  id: number,
  formData: FormData
): Promise<number> {
  const response = await axios.put<ApiResponse<number>>(
    `${API_BASE_URL}/api/MenuItem/Update/${id}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type header-i burada YOXDUR — axios FormData üçün avtomatik set edəcək
      },
    }
  );
  return unwrap(response.data);
}

export async function deleteMenuItem(
  token: string,
  id: number
): Promise<void> {
  await authApi.delete(`/api/MenuItem/Delete/${id}`, authHeaders(token));
}

// ─── WiFi ────────────────────────────────────────────────────────────────────

export async function getWifiByTenant(
  token: string,
  tenantId: number
): Promise<WifiInfo[]> {
  const { data } = await authApi.get<ApiResponse<WifiInfo[]>>(
    `/api/RestorantWifiInformation/List?tenantId=${tenantId}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function addWifi(
  token: string,
  body: CreateWifiRequest
): Promise<WifiInfo> {
  const { data } = await authApi.post<ApiResponse<WifiInfo>>(
    "/api/RestorantWifiInformation/Add",
    body,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function updateWifi(
  token: string,
  body: UpdateWifiRequest
): Promise<WifiInfo> {
  const { data } = await authApi.put<ApiResponse<WifiInfo>>(
    "/api/RestorantWifiInformation/Update",
    body,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function deleteWifi(
  token: string,
  id: number
): Promise<void> {
  await authApi.delete(
    `/api/RestorantWifiInformation/Delete/${id}`,
    authHeaders(token)
  );
}

// ─── Tenant Links ────────────────────────────────────────────────────────────

export async function getLinksByTenant(
  token: string,
  tenantId: number
): Promise<TenantLink[]> {
  // /List endpoint server-side branch-scope filter — Branch Admin yalnız öz branch link-ləri görür
  const { data } = await authApi.get<ApiResponse<TenantLink[]>>(
    `/api/TenantLink/List?tenantId=${tenantId}`,
    authHeaders(token)
  );
  return unwrap(data) ?? [];
}

export async function addLink(
  token: string,
  body: CreateLinkRequest
): Promise<TenantLink> {
  const { data } = await authApi.post<ApiResponse<TenantLink>>(
    "/api/TenantLink/Add",
    body,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function updateLink(
  token: string,
  body: UpdateLinkRequest
): Promise<TenantLink> {
  const { data } = await authApi.put<ApiResponse<TenantLink>>(
    "/api/TenantLink/Update",
    body,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function deleteLink(token: string, id: number): Promise<void> {
  await authApi.delete(`/api/TenantLink/Delete/${id}`, authHeaders(token));
}

export async function reorderLinks(
  token: string,
  body: ReorderLinksRequest
): Promise<void> {
  await authApi.put(
    "/api/TenantLink/Reorder",
    body,
    authHeaders(token)
  );
}

// ─── Branch (self-service URL fields) ───────────────────────────────────────

export interface BranchSocialUrls {
  id: number;
  name: string;
  slug?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  whatsAppUrl?: string | null;
  telegramUrl?: string | null;
  linkedInUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  tripAdvisorUrl?: string | null;
  yelpUrl?: string | null;
  threadsUrl?: string | null;
  pinterestUrl?: string | null;
  websiteUrl?: string | null;
  locationUrl?: string | null;
  wazeLocationUrl?: string | null;
  menuUrl?: string | null;
}

export async function getBranchById(token: string, id: number): Promise<BranchSocialUrls> {
  const { data } = await authApi.get<ApiResponse<BranchSocialUrls>>(
    `/api/branch/GetById?id=${id}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function updateBranchUrl(
  token: string,
  id: number,
  field: keyof BranchSocialUrls,
  value: string | null
): Promise<void> {
  const body = { [field]: value } as Record<string, string | null>;
  await authApi.post(`/api/branch/Update?id=${id}`, body, authHeaders(token));
}

// ─── Branch (admin: list + full update + banner) ─────────────────────────────

export async function listBranches(token: string): Promise<AdminBranch[]> {
  const { data } = await authApi.get<ApiResponse<AdminBranch[]>>(
    "/api/branch/List",
    authHeaders(token)
  );
  return unwrap(data) ?? [];
}

export async function getBranchAdmin(token: string, id: number): Promise<AdminBranch> {
  const { data } = await authApi.get<ApiResponse<AdminBranch>>(
    `/api/branch/GetById?id=${id}`,
    authHeaders(token)
  );
  return unwrap(data);
}

export async function updateBranch(
  token: string,
  id: number,
  body: UpdateBranchPatchRequest
): Promise<void> {
  await authApi.post(`/api/branch/Update?id=${id}`, body, authHeaders(token));
}

export async function uploadBranchImage(
  token: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axios.post<ApiResponse<{ url: string; fileName: string }>>(
    `${API_BASE_URL}/api/branch/UploadImage`,
    fd,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return unwrap(res.data);
}

export async function uploadBannerVideo(
  token: string,
  file: File
): Promise<BannerVideoUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axios.post<ApiResponse<BannerVideoUploadResponse>>(
    `${API_BASE_URL}/api/branch/UploadBannerVideo`,
    fd,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return unwrap(res.data);
}

// ─── Branding ────────────────────────────────────────────────────────────────

export async function addBranding(
  token: string,
  formData: FormData
): Promise<unknown> {
  // FormData göndərəndə birbaşa axios.post istifadə edirik ki,
  // avtomatik "multipart/form-data; boundary=..." header-i set olunsun
  const response = await axios.post<ApiResponse<unknown>>(
    `${API_BASE_URL}/api/TenantBranding/Add`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type header-i burada YOXDUR — axios FormData üçün avtomatik set edəcək
      },
    }
  );
  
  return unwrap(response.data);
}

// ─── Tenant Config (for admin panel display) ─────────────────────────────────

export async function getTenantConfigBySlug(
  slug: string
): Promise<TenantConfig | null> {
  try {
    const { data } = await publicApi.get<ApiResponse<TenantConfig>>(
      `/api/public/tenants/${slug}`
    );
    return unwrap(data);
  } catch {
    return null;
  }
}
