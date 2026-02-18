import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { fetchTenantById } from "@/lib/tenant";

// API URL-i environment variable-dan götür və trailing slash-i təmizlə
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Development-da HTTPS self-signed certificate problemi üçün
// .env.local faylında NODE_TLS_REJECT_UNAUTHORIZED=0 əlavə edin (yalnız development üçün)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        userName: { label: "İstifadəçi adı", type: "text" },
        password: { label: "Şifrə", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) {
          console.error("[Auth] Missing credentials");
          return null;
        }

        try {
          if (!API_BASE_URL) {
            console.error(
              "[Auth] NEXT_PUBLIC_API_URL environment variable is not set"
            );
            return null;
          }

          const loginUrl = `${API_BASE_URL}/api/Users/LogIn`;
          console.log(`[Auth] Attempting login to: ${loginUrl}`);
          
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userName: credentials.userName,
              password: credentials.password,
              deviceId: "",
            }),
          });

          if (!res.ok) {
            console.error(`[Auth] Login API failed: ${res.status} ${res.statusText}`);
            return null;
          }

          const json = await res.json();
          
          if (!json.success) {
            console.error(`[Auth] Login failed: ${json.message || "Unknown error"}`);
            return null;
          }

          if (!json.data) {
            console.error("[Auth] Login response missing data");
            return null;
          }

          const data = json.data;
          const tenantId = data.tenantId ?? 0;

          // Resolve tenant slug and name from tenantId (with timeout to avoid blocking login)
          let tenantSlug = "";
          let tenantName = "";
          if (tenantId) {
            try {
              // Timeout after 3 seconds — don't block login if tenant resolution is slow
              const tenantConfigPromise = fetchTenantById(tenantId);
              const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 3000)
              );
              const tenantConfig = await Promise.race([
                tenantConfigPromise,
                timeoutPromise,
              ]);

              if (tenantConfig) {
                tenantSlug = tenantConfig.slug;
                tenantName = tenantConfig.name;
              } else {
                console.warn(`[Auth] Tenant ${tenantId} resolution timeout or not found`);
              }
            } catch (error) {
              // Tenant resolution failed — admin will still work without slug
              console.warn(`[Auth] Failed to resolve tenant ${tenantId}:`, error);
            }
          }

          return {
            id: String(data.id),
            email: data.email || data.userName,
            name: `${data.firstName} ${data.lastName}`,
            accessToken: data.token,
            refreshToken: data.refreshToken,
            refreshTokenExpiration: data.refreshTokenExpiration,
            expiration: data.expiration,
            tenantId,
            tenantSlug,
            tenantName,
            roles: data.roles || [],
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone ?? "",
          };
        } catch (error) {
          console.error("[Auth] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.refreshTokenExpiration = user.refreshTokenExpiration;
        token.expiration = user.expiration;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.userId = Number(user.id);
        token.roles = user.roles;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
        token.email = user.email ?? "";
      }

      // Check if token is expired and refresh
      if (token.expiration) {
        const expiresAt = new Date(token.expiration).getTime();
        const now = Date.now();
        // If token expires in less than 5 minutes, try to refresh
        if (now > expiresAt - 5 * 60 * 1000) {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/Users/RefreshToken`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: token.refreshToken }),
              }
            );
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.data) {
                token.accessToken = json.data.token;
                token.refreshToken = json.data.refreshToken;
                token.refreshTokenExpiration = json.data.refreshTokenExpiration;
                token.expiration = json.data.expiration;
              }
            }
          } catch {
            // Refresh failed — token will be used as-is
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const s = session as any;
      s.accessToken = token.accessToken;
      s.tenantId = token.tenantId;
      s.tenantSlug = token.tenantSlug;
      s.tenantName = token.tenantName;
      s.userId = token.userId;
      s.roles = token.roles;
      s.user = {
        ...session.user,
        id: String(token.userId),
        firstName: token.firstName,
        lastName: token.lastName,
        phone: token.phone,
        tenantId: token.tenantId,
        tenantSlug: token.tenantSlug,
        tenantName: token.tenantName,
        roles: token.roles,
        email: token.email,
      };
      return s;
    },
  },
});
