import { publicApi, unwrap } from "./client";
import type {
  ApiResponse,
  PublicTenantListItem,
  TenantConfig,
  RestaurantPublic,
  PublicMenuCategory,
  CountrySequence,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResetPasswordRequest,
  ResendOtpRequest,
  ResendOtpResponse,
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

// ─── Reset Password ─────────────────────────────────────────────────────────

export async function getCountries(): Promise<CountrySequence[]> {
  const { data } = await publicApi.get<ApiResponse<CountrySequence[]>>(
    "/api/Public/countries"
  );
  return unwrap(data);
}

export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const { data } = await publicApi.post<ApiResponse<ForgotPasswordResponse>>(
    "/api/Users/ForgotPassword/forgot-password",
    request
  );
  return unwrap(data);
}

export async function verifyForgotPasswordOtp(
  request: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  const { data } = await publicApi.post<ApiResponse<VerifyOtpResponse>>(
    "/api/Users/VerifyForgotPasswordOtp/verify-forgot-password-otp",
    request
  );
  return unwrap(data);
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<void> {
  await publicApi.post<ApiResponse<void>>(
    "/api/Users/ResetPassword/reset-password",
    request
  );
}

export async function resendOtp(
  request: ResendOtpRequest
): Promise<ResendOtpResponse> {
  const { data } = await publicApi.post<ApiResponse<ResendOtpResponse>>(
    "/api/Users/ResendOtp/resend-otp",
    request
  );
  return unwrap(data);
}
