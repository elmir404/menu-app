import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiration: string;
    expiration: string;
    tenantId: number;
    tenantSlug: string;
    tenantName: string;
    roles: string[];
    firstName: string;
    lastName: string;
    phone: string;
  }

  interface Session {
    accessToken: string;
    tenantId: number;
    tenantSlug: string;
    tenantName: string;
    userId: number;
    roles: string[];
    user: {
      id: string;
      name: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      tenantId: number;
      tenantSlug: string;
      tenantName: string;
      roles: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiration: string;
    expiration: string;
    tenantId: number;
    tenantSlug: string;
    tenantName: string;
    userId: number;
    roles: string[];
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  }
}
