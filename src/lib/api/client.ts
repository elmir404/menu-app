import axios from "axios";
import type { ApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Public axios instance (no auth) ────────────────────────────────────────
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Authenticated axios instance ───────────────────────────────────────────
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Helper: unwrap ApiResponse<T> → T
export function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(response.message || "API request failed");
  }
  return response.data;
}

// ─── Media URL helper ────────────────────────────────────────────────────────
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || "";

export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${MEDIA_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
