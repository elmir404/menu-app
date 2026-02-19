// ─── Generic API response wrapper ────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// ─── Public Tenant (list) ────────────────────────────────────────────────────
export interface PublicTenantListItem {
  name: string;
  slug: string;
  description: string;
}

// ─── Branding ────────────────────────────────────────────────────────────────
export interface Branding {
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  iconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  description: string | null;
  website: string | null;
}

// ─── WiFi Info ───────────────────────────────────────────────────────────────
export interface WifiInfo {
  id: number;
  password: string;
  ssid: string;
  tenantId?: number;
  tenant?: unknown;
}

// ─── Tenant Config (single tenant detail — public) ──────────────────────────
export interface TenantConfig {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  primaryColor: string;
  domain: string | null;
  menuApiUrl: string;
  wifiInformation: WifiInfo[];
  branding: Branding | null;
}

// ─── Restaurant (public) ────────────────────────────────────────────────────
export interface RestaurantLocation {
  countryName: string;
  cityName: string;
  timeZoneName: string;
}

export interface RestaurantPublic {
  id: number;
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
  locationUrl: string | null;
  wazeLocationUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  whatsAppUrl: string | null;
  telegramUrl: string | null;
  linkedInUrl: string | null;
  branding: Branding | null;
  location: RestaurantLocation | null;
}

// ─── Public Menu ─────────────────────────────────────────────────────────────
export interface PublicMenuItem {
  id: number;
  azName: string;
  enName: string;
  ruName: string;
  azDescription: string | null;
  enDescription: string | null;
  ruDescription: string | null;
  currency: string;
  currencySign: string;
  price: number;
  discountPrice: number;
  prepTimeMinutes: string;
  imageUrls: string[];
}

export interface PublicMenuCategory {
  id: number;
  azName: string;
  enName: string;
  ruName: string;
  azDescription: string | null;
  enDescription: string | null;
  ruDescription: string | null;
  items: PublicMenuItem[];
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  userName: string | null;
  password: string | null;
  deviceId: string;
}

export interface LoginResponse {
  id: number;
  tenantId: number | null;
  programId: number | null;
  walveroId: number | null;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string;
  token: string;
  expiration: string;
  refreshToken: string;
  refreshTokenExpiration: string;
  roles: string[];
  googleLogoUrl: string | null;
}

// ─── Admin: Menu Category ────────────────────────────────────────────────────
export interface AdminMenuCategory {
  id: number;
  azName: string;
  enName: string;
  ruName: string;
  azDescription: string | null;
  enDescription: string | null;
  ruDescription: string | null;
  tenantId: number;
  menuItems: AdminMenuItem[] | null;
}

export interface CreateMenuCategoryRequest {
  azName: string;
  enName: string;
  ruName: string;
  azDescription?: string;
  enDescription?: string;
  ruDescription?: string;
  tenantId: number;
}

export interface UpdateMenuCategoryRequest {
  id: number;
  azName: string;
  enName: string;
  ruName: string;
  azDescription?: string;
  enDescription?: string;
  ruDescription?: string;
}

// ─── Admin: Menu Item ────────────────────────────────────────────────────────
export interface MenuItemImage {
  id: number;
  fileName: string;
  path: string;
  menuItemId: number;
}

export interface AdminMenuItem {
  id: number;
  currency: string;
  azName: string;
  enName: string;
  ruName: string;
  azDescription: string | null;
  enDescription: string | null;
  ruDescription: string | null;
  prepTimeMinutes: string;
  currencySign: string;
  price: number;
  discountPrice: number;
  menuCategoryId: number;
  menuCategory: AdminMenuCategory | null;
  menuItemImages: MenuItemImage[];
}

export interface CreateMenuItemRequest {
  currency: string;
  azName: string;
  enName: string;
  ruName: string;
  azDescription?: string;
  enDescription?: string;
  ruDescription?: string;
  prepTimeMinutes?: string;
  currencySign: string;
  price: number;
  discountPrice?: number;
  menuCategoryId: number;
}

// ─── Admin: WiFi ─────────────────────────────────────────────────────────────
export interface CreateWifiRequest {
  password: string;
  ssid: string;
  tenantId: number;
}

export interface UpdateWifiRequest {
  id: number;
  password: string;
  ssid: string;
  tenantId: number;
}

// ─── Admin: Branding ─────────────────────────────────────────────────────────
export interface AdminBranding extends Branding {
  id?: number;
  tenantId?: number;
}

// ─── Reset Password ─────────────────────────────────────────────────────────
export interface CountrySequence {
  countryCode: number;
  name: string;
  code: string;
  flag: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ForgotPasswordResponse {
  otpSent: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  resetToken: string;
  message: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResendOtpRequest {
  userId: number;
  purpose: string; // "PasswordReset"
}

export interface ResendOtpResponse {
  userId: number;
  otpRequired: boolean;
  otpSent: boolean;
  purpose: string;
}
