import { publicApi, unwrap } from "./client";
import type { ApiResponse, LoginRequest, LoginResponse } from "@/types/api";

export async function loginUser(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const { data } = await publicApi.post<ApiResponse<LoginResponse>>(
    "/api/Users/LogIn",
    credentials
  );
  return unwrap(data);
}

export async function refreshUserToken(
  refreshToken: string
): Promise<LoginResponse> {
  const { data } = await publicApi.post<ApiResponse<LoginResponse>>(
    "/api/Users/RefreshToken",
    { refreshToken }
  );
  return unwrap(data);
}
