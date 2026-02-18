import { publicApi, unwrap } from "./client";
import type {
  ApiResponse,
  PublicTenantListItem,
  TenantConfig,
  RestaurantPublic,
  PublicMenuCategory,
} from "@/types/api";

export async function getPublicTenants(): Promise<PublicTenantListItem[]> {
  const { data } = await publicApi.get<ApiResponse<PublicTenantListItem[]>>(
    "/api/public/tenants"
  );
  return unwrap(data);
}

export async function getPublicTenant(
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

export async function getPublicRestaurant(
  slug: string
): Promise<RestaurantPublic | null> {
  try {
    const { data } = await publicApi.get<ApiResponse<RestaurantPublic>>(
      `/api/public/restaurants/${slug}`
    );
    return unwrap(data);
  } catch {
    return null;
  }
}

export async function getPublicMenu(
  slug: string
): Promise<PublicMenuCategory[]> {
  const { data } = await publicApi.get<ApiResponse<PublicMenuCategory[]>>(
    `/api/public/menu/${slug}`
  );
  return unwrap(data);
}
