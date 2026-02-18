import axios from "axios";
import { authApi, publicApi, unwrap } from "./client";
import type {
  ApiResponse,
  AdminMenuCategory,
  AdminMenuItem,
  TenantConfig,
  WifiInfo,
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  CreateWifiRequest,
  UpdateWifiRequest,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─── Menu Categories ─────────────────────────────────────────────────────────

export async function getCategories(
  token: string
): Promise<AdminMenuCategory[]> {
  const { data } = await authApi.get<ApiResponse<AdminMenuCategory[]>>(
    "/api/MenuCategory/GetAll",
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

export async function deleteCategory(
  token: string,
  id: number
): Promise<void> {
  await authApi.delete(`/api/MenuCategory/Delete/${id}`, authHeaders(token));
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

export async function getMenuItems(
  token: string
): Promise<AdminMenuItem[]> {
  const { data } = await authApi.get<ApiResponse<AdminMenuItem[]>>(
    "/api/MenuItem/GetAll",
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
    `/api/RestorantWifiInformation/GetByTenantId/${tenantId}`,
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
