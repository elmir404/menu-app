# Multi-Tenancy Dokumentasiyası

## Mündəricat

1. [Ümumi baxış](#ümumi-baxış)
2. [Arxitektura](#arxitektura)
3. [API endpointləri](#api-endpointləri)
4. [Tenant məlumat axını](#tenant-məlumat-axını)
5. [Xarici API inteqrasiyası](#xarici-api-inteqrasiyası)
6. [Local seed data (fallback)](#local-seed-data-fallback)
7. [Routing strukturu](#routing-strukturu)
8. [Middleware davranışı](#middleware-davranışı)
9. [Komponentlərdə istifadə](#komponentlərdə-istifadə)
10. [SEO və Sitemap](#seo-və-sitemap)
11. [Yeni tenant əlavə etmə](#yeni-tenant-əlavə-etmə)
12. [Problemlərin həlli](#problemlərin-həlli)

---

## Ümumi baxış

Bu layihə **dinamik, API-əsaslı multi-tenancy** istifadə edir. Tenant məlumatları hardcode edilmir — hər istək zamanı API-dən götürülür.

**İş prinsipi:**

```
İstifadəçi /az/pubzade yazır
       ↓
Middleware: locale yoxlayır, slug-u buraxır
       ↓
Tenant Layout: fetchTenantConfig("pubzade") çağırır
       ↓
API-dən tenant məlumatları gəlir (və ya 404)
       ↓
Səhifə render olunur (və ya "tapılmadı" göstərilir)
```

Bu yanaşmanın üstünlükləri:
- **Heç bir fayl redaktəsi tələb etmir** — yeni tenant API-yə əlavə ediləndə avtomatik işləyir
- **Real-time** — tenant məlumatları dəyişdikdə sayt yenidən build etmədən yenilənir
- **Xarici API dəstəyi** — `TENANT_API_URL` env dəyişəni ilə istənilən backend-ə qoşulur
- **Fallback** — API əlçatmaz olduqda local seed data istifadə olunur

---

## Arxitektura

### Əsas fayllar

| Fayl | Məsuliyyət |
|------|-----------|
| `src/lib/tenant.ts` | `fetchTenantConfig()`, `fetchAllTenants()` — async funksiyalar |
| `src/app/api/tenants/route.ts` | `GET /api/tenants` — bütün tenant-ların siyahısı |
| `src/app/api/tenants/[slug]/route.ts` | `GET /api/tenants/{slug}` — tək tenant məlumatı |
| `src/components/providers/TenantProvider.tsx` | React Context — client komponentlərə tenant ötürür |
| `src/app/[locale]/[tenant]/layout.tsx` | Tenant layout — API-dən fetch + TenantProvider |
| `src/middleware.ts` | Locale redirect + slug format yoxlaması |

### Diaqram

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Browser    │────▶│   Next.js Middleware  │────▶│  Tenant Layout  │
│  /az/pubzade │     │  (locale redirect)   │     │  fetchTenant()  │
└──────────────┘     └──────────────────────┘     └────────┬────────┘
                                                           │
                                          ┌────────────────┴────────────────┐
                                          │                                 │
                                    TENANT_API_URL               Local seed data
                                    mühit dəyişəni                (fallback)
                                    təyin olunub?
                                          │                                 │
                                    ┌─────┴─────┐                          │
                                    │           │                          │
                                  Bəli        Xeyr ────────────────────────┘
                                    │
                              ┌─────┴──────┐
                              │ Xarici API │
                              │ GET /{slug}│
                              └─────┬──────┘
                                    │
                              200: tenant var → render
                              404: tenant yoxdur → Next.js 404 səhifəsi
```

---

## API endpointləri

### `GET /api/tenants`

Bütün qeydiyyatdan keçmiş tenant-ları qaytarır.

**Cavab:** `200 OK`
```json
[
  {
    "id": "walvero",
    "name": "Walvero",
    "slug": "walvero",
    "description": "Digital menu platform for modern restaurants",
    "primaryColor": "#1c1917",
    "menuApiUrl": "/menu.json"
  },
  {
    "id": "pubzade",
    "name": "Pubzade",
    "slug": "pubzade",
    "description": "Traditional Azerbaijani restaurant",
    "primaryColor": "#78350f",
    "menuApiUrl": "/tenants/pubzade/menu.json"
  }
]
```

### `GET /api/tenants/{slug}`

Verilmiş slug üzrə tək tenant qaytarır.

**Uğurlu cavab:** `200 OK`
```json
{
  "id": "walvero",
  "name": "Walvero",
  "slug": "walvero",
  "description": "Digital menu platform for modern restaurants",
  "primaryColor": "#1c1917",
  "menuApiUrl": "/menu.json"
}
```

**Tenant tapılmadıqda:** `404 Not Found`
```json
{
  "error": "Tenant not found",
  "slug": "bilinmeyen"
}
```

### `TenantConfig` interfeysi

```typescript
interface TenantConfig {
  id: string;           // Unikal identifikator
  name: string;         // Göstərilən ad (UI, SEO metadata)
  slug: string;         // URL seqmenti (kiçik hərf, rəqəm, tire)
  description: string;  // Qısa təsvir
  logo?: string;        // Logo URL (opsional)
  primaryColor: string; // Brend rəngi (hex: "#1c1917")
  domain?: string;      // Xüsusi domain (opsional)
  menuApiUrl: string;   // Menyu JSON faylının URL-i
}
```

---

## Tenant məlumat axını

### Server komponentlərində (layout, page)

Server komponentləri `fetchTenantConfig()` funksiyasını **birbaşa** çağırır. Bu funksiya:
1. `TENANT_API_URL` env dəyişəni var → xarici API-yə `fetch()` edir
2. `TENANT_API_URL` yoxdur → local seed data-dan oxuyur
3. Next.js `fetch()` cache ilə 60 saniyə keşləyir (`revalidate: 60`)

```typescript
// src/app/[locale]/[tenant]/layout.tsx
import { fetchTenantConfig } from "@/lib/tenant";

const tenantConfig = await fetchTenantConfig(tenant);
if (!tenantConfig) {
  notFound(); // 404 səhifəsi
}
```

### Client komponentlərində

Client komponentləri `TenantProvider` vasitəsilə artıq yüklənmiş tenant datanı istifadə edir. Əlavə fetch tələb olunmur:

```typescript
"use client";
import { useTenant } from "@/components/providers/TenantProvider";

const tenant = useTenant();
console.log(tenant.name); // "Walvero"
```

### Xarici client-lər (mobil app, digər frontend-lər)

REST API endpointlərini birbaşa çağıra bilər:

```bash
# Bütün tenant-lar
curl https://your-domain.com/api/tenants

# Tək tenant
curl https://your-domain.com/api/tenants/walvero
```

---

## Xarici API inteqrasiyası

Tenant datanı xarici backend-dən almaq üçün `.env.local` faylında `TENANT_API_URL` təyin edin:

```env
# .env.local
TENANT_API_URL=https://api.walvero.com/v1/tenants
```

### Xarici API tələbləri

Sizin xarici API aşağıdakı endpointləri dəstəkləməlidir:

#### `GET {TENANT_API_URL}/{slug}`

Tək tenant qaytarmalıdır. `TenantConfig` formatına uyğun JSON cavab.

| Status | Mənası |
|--------|--------|
| `200`  | Tenant tapıldı — JSON body |
| `404`  | Tenant yoxdur |
| `5xx`  | Server xətası — local fallback istifadə olunacaq |

#### `GET {TENANT_API_URL}`

Bütün tenant-ların massivini qaytarmalıdır. Sitemap generasiyası üçün istifadə olunur.

| Status | Mənası |
|--------|--------|
| `200`  | Tenant siyahısı — JSON array |
| `5xx`  | Server xətası — local fallback istifadə olunacaq |

### Nümunə: Express.js backend    

```javascript
// Backend tərəf nümunəsi
app.get("/v1/tenants", async (req, res) => {
  const tenants = await db.query("SELECT * FROM tenants WHERE active = true");
  res.json(tenants);
});

app.get("/v1/tenants/:slug", async (req, res) => {
  const tenant = await db.query(
    "SELECT * FROM tenants WHERE slug = $1 AND active = true",
    [req.params.slug]
  );
  if (!tenant) return res.status(404).json({ error: "Not found" });
  res.json(tenant);
});
```

### Nümunə: Database cədvəli

```sql
CREATE TABLE tenants (
  id            VARCHAR(50) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  description   TEXT,
  logo          VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#1c1917',
  domain        VARCHAR(200),
  menu_api_url  VARCHAR(500) NOT NULL,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

INSERT INTO tenants (id, name, slug, description, primary_color, menu_api_url) VALUES
('walvero', 'Walvero', 'walvero', 'Digital menu platform', '#1c1917', '/menu.json'),
('pubzade', 'Pubzade', 'pubzade', 'Traditional restaurant', '#78350f', '/tenants/pubzade/menu.json');
```

### Keşləmə

Next.js fetch cache `revalidate: 60` istifadə edir — yəni tenant datası **60 saniyə** keşlənir. Bu dəyəri `src/lib/tenant.ts` faylında `REVALIDATE_SECONDS` sabitindən dəyişə bilərsiniz:

```typescript
const REVALIDATE_SECONDS = 60; // 60 saniyə keşləmə
```

Keşi sıfırlamaq üçün:
```bash
# Dev mühitdə — serveri yenidən başladın
# Prod mühitdə — Next.js revalidate mexanizmi avtomatik işləyir
```

---

## Local seed data (fallback)

`TENANT_API_URL` təyin olunmadıqda və ya xarici API əlçatmaz olduqda, `src/lib/tenant.ts` faylındakı `seedTenants` obyekti istifadə olunur:

```typescript
// src/lib/tenant.ts
const seedTenants: Record<string, TenantConfig> = {
  walvero: {
    id: "walvero",
    name: "Walvero",
    slug: "walvero",
    description: "Digital menu platform for modern restaurants",
    primaryColor: "#1c1917",
    menuApiUrl: "/menu.json",
  },
};
```

Bu, development zamanı xarici API olmadan da işləməyə imkan verir. Production-da isə `TENANT_API_URL` təyin edib bütün tenant-ları backend-dən idarə edə bilərsiniz.

### Yeni seed tenant əlavə etmək (development üçün)

```typescript
const seedTenants: Record<string, TenantConfig> = {
  walvero: { /* ... */ },

  // Development üçün əlavə tenant
  pubzade: {
    id: "pubzade",
    name: "Pubzade",
    slug: "pubzade",
    description: "Traditional Azerbaijani restaurant in Baku",
    primaryColor: "#78350f",
    menuApiUrl: "/tenants/pubzade/menu.json",
  },
};
```

---

## Routing strukturu

### URL formatı

```
/{locale}/{tenant}/{page}
```

| Seqment | Nümunə | Məna |
|---------|--------|------|
| `locale` | `az`, `en`, `ru` | Dil (middleware yoxlayır) |
| `tenant` | `walvero`, `pubzade` | Tenant slug (API-dən yoxlanır) |
| `page` | `restaurant`, `menu`, `checkout` | Səhifə |

### Mövcud routlar

| Route | Təsvir |
|-------|--------|
| `/{locale}/{tenant}` | Ana səhifə (SaaS landing) |
| `/{locale}/{tenant}/restaurant` | Restoran məlumatları |
| `/{locale}/{tenant}/menu` | Menyu + səbət |
| `/{locale}/{tenant}/checkout` | Sifariş |

### Tenant URL nümunələri

```
/az/walvero              → Walvero ana səhifə (AZ)
/en/walvero/menu         → Walvero menyu (EN)
/ru/pubzade/restaurant   → Pubzade restoran (RU)
/az/nargile              → Nargile ana səhifə (AZ)
```

---

## Middleware davranışı

Middleware (`src/middleware.ts`) **tenant-ı yoxlamır** — yalnız locale və URL formatını idarə edir. Tenant yoxlanması layout-da API vasitəsilə baş verir.

### Yönləndirmə qaydaları

| Giriş URL | Çıxış URL | Qayda |
|-----------|-----------|-------|
| `/` | `/az/walvero` | Root → default locale + default tenant |
| `/az` | `/az/walvero` | Yalnız locale → default tenant əlavə et |
| `/en` | `/en/walvero` | Yalnız locale → default tenant əlavə et |
| `/az/walvero` | — (pass) | Tam URL → dəyişiklik yox |
| `/az/pubzade` | — (pass) | **Hər slug-u buraxır** — layout yoxlayacaq |
| `/az/menu` | `/az/walvero/menu` | Bilinen səhifə, tenant yox → default əlavə |
| `/walvero` | `/az/walvero` | Locale yox → browser dilindən təyin |
| `/pubzade/menu` | `/az/pubzade/menu` | Locale yox → browser dilindən təyin |

### Slug format yoxlaması

Middleware `couldBeTenantSlug()` funksiyasını istifadə edir — yalnız formatı yoxlayır (API çağırmır):

- Kiçik hərflər + rəqəmlər + tire: `pubzade` ✅, `nargile-lounge` ✅
- Böyük hərflər: `Pubzade` ❌
- Boşluq: `my restaurant` ❌
- Rezerv olunmuş adlar: `restaurant` ❌, `menu` ❌, `api` ❌, `_next` ❌

---

## Komponentlərdə istifadə

### Server komponentlərində

```typescript
// src/app/[locale]/[tenant]/my-page/page.tsx
import { fetchTenantConfig } from "@/lib/tenant";

export default async function MyPage({
  params,
}: {
  params: Promise<{ locale: string; tenant: string }>;
}) {
  const { locale, tenant } = await params;
  const tenantConfig = await fetchTenantConfig(tenant);

  if (!tenantConfig) return null; // layout artıq 404 göstərir

  return <h1>{tenantConfig.name}</h1>;
}
```

### Client komponentlərində

```typescript
"use client";

import { useTenant } from "@/components/providers/TenantProvider";

export default function MyComponent() {
  const tenant = useTenant();

  return (
    <div>
      <h1>{tenant.name}</h1>
      <p>{tenant.description}</p>
      <p style={{ color: tenant.primaryColor }}>Brend rəngində mətn</p>
    </div>
  );
}
```

### Naviqasiya linkləri

```typescript
import Link from "next/link";

// ✅ Düzgün — locale və tenant saxlanılır
<Link href={`/${locale}/${tenant}/menu`}>Menyu</Link>

// ❌ Yanlış — tenant itəcək
<Link href="/menu">Menyu</Link>
```

### Helper funksiyalar

```typescript
import {
  fetchTenantConfig,    // (slug) → Promise<TenantConfig | null>
  fetchAllTenants,      // () → Promise<TenantConfig[]>
  fetchAllTenantSlugs,  // () → Promise<string[]>
  couldBeTenantSlug,    // (segment) → boolean (sync, format yoxlaması)
  defaultTenant,        // string ("walvero")
} from "@/lib/tenant";
```

---

## SEO və Sitemap

### Metadata

Hər səhifədə `generateMetadata` funksiyası tenant adını API-dən alır:

```typescript
export async function generateMetadata({ params }) {
  const tenantConfig = await fetchTenantConfig(tenant);
  const tenantName = tenantConfig?.name || tenant;
  // → "Menyu | Pubzade"
}
```

### Sitemap

`sitemap.xml` bütün tenant-ları API-dən çəkir:

```typescript
// src/app/sitemap.ts
const tenants = await fetchAllTenantSlugs();
// → ["walvero", "pubzade", "nargile", ...]
```

Yeni tenant API-yə əlavə edildikdə sitemap avtomatik yenilənir.

### JSON-LD

Ana səhifədə tenant adı ilə strukturlaşdırılmış data yaranır:
- `Organization` — tenant adı
- `WebSite` — sayt URL + dil
- `SoftwareApplication` — platforma

---

## Yeni tenant əlavə etmə

### Variant 1: Xarici API ilə (production)

1. Backend-də tenant-ı database-ə əlavə edin:

```sql
INSERT INTO tenants (id, name, slug, description, primary_color, menu_api_url)
VALUES ('pubzade', 'Pubzade', 'pubzade', 'Traditional restaurant', '#78350f', 'https://api.example.com/menus/pubzade');
```

2. Hazırdır! Frontend heç bir dəyişiklik tələb etmir.
   - `https://your-domain.com/az/pubzade` — avtomatik işləyir
   - `https://your-domain.com/api/tenants/pubzade` — API cavab verir
   - `sitemap.xml` — avtomatik yenilənir

### Variant 2: Local seed data ilə (development)

1. `src/lib/tenant.ts` → `seedTenants` obyektinə əlavə edin
2. Menyu JSON-unu `public/tenants/{slug}/menu.json`-a yerləşdirin
3. Dev server yenidən başladın

### Menyu JSON formatı

```json
{
  "restaurant": {
    "image": "https://...",
    "rating": 4.7,
    "name": "Restoran adı",
    "address": "Ünvan",
    "phone": "+994551234567",
    "wifi": { "ssid": "Network", "password": "pass123" },
    "googleLocation": "https://maps.app.goo.gl/...",
    "wazeLocation": "https://waze.com/ul/...",
    "categories": [
      {
        "id": "cat-1",
        "name": "Kateqoriya",
        "items": [
          {
            "id": "item-1",
            "name": "Məhsul",
            "price": 10,
            "currencySign": "₼",
            "description": "Təsvir",
            "prepTimeMinutes": 15,
            "currency": "AZN",
            "image": "https://..."
          }
        ]
      }
    ]
  }
}
```

---

## Admin Panel (Tenant İdarəetməsi)

### Ümumi baxış

Hər tenant-ın öz admin paneli var. Admin istifadəçilər login olduqda, onların `tenantId`-si session-a yazılır və yalnız öz tenant-larının datasını görürlər.

### Giriş axını

```
İstifadəçi /login yazır
       ↓
NextAuth: email/şifrə ilə backend API-yə sorğu
       ↓
Backend: LoginResponse qaytarır (tenantId daxil)
       ↓
NextAuth authorize: fetchTenantById(tenantId) çağırır
       ↓
Tenant slug və adı JWT/session-a yazılır
       ↓
/admin dashboard-a yönləndirilir
```

### Session məlumatları

Login sonrası session-da aşağıdakı tenant məlumatları mövcuddur:

```typescript
session.tenantId    // number — backend tərəfdən gələn tenant ID
session.tenantSlug  // string — tenant-ın URL slug-u (məs. "pubzade")
session.tenantName  // string — tenant-ın adı (məs. "Pubzade")
session.user.tenantId
session.user.tenantSlug
session.user.tenantName
```

### Admin routing strukturu

```
/login                      → Giriş (NextAuth credentials)
/admin                      → Dashboard (tenant-a xas statistika)
/admin/menu/categories      → Kateqoriya idarəsi
/admin/menu/categories/new  → Yeni kateqoriya
/admin/menu/items           → Menyu item idarəsi
/admin/menu/items/new       → Yeni menyu itemi
/admin/wifi                 → WiFi idarəsi
/admin/branding             → Branding idarəsi (rənglər, logo, fon)
```

### Tenant izolasiyası

| Qat | Mexanizm |
|-----|----------|
| **Backend API** | Auth token ilə — backend yalnız istifadəçinin tenant-ına aid datanı qaytarır |
| **Frontend filtering** | `session.tenantId` ilə — kateqoriyalar və itemlər frontend-də də filtrlənir |
| **WiFi** | `/api/RestorantWifiInformation/GetByTenantId/{tenantId}` — birbaşa tenant-a görə sorğu |
| **Branding** | `tenantId` formData-ya əlavə edilir |
| **Create əməliyyatları** | Hər create sorğusunda `tenantId` göndərilir |

### Admin sidebar

Admin sidebar-da aşağıdakılar göstərilir:
- **Tenant logosu/adı** — header-da (branding-dən)
- **Naviqasiya linkləri** — Dashboard, Kateqoriyalar, Menyu, WiFi, Branding
- **Publik menyuya bax** — tenant-ın publik menyusuna yeni tab-da link
- **İstifadəçi məlumatı** — ad, tenant adı, çıxış düyməsi

### `useAdminTenant` hook

Admin paneldə tenant config-i (branding, ad, slug) əldə etmək üçün:

```typescript
"use client";
import { useAdminTenant } from "@/hooks/use-admin-tenant";

export function MyAdminComponent() {
  const { data: tenantConfig, isLoading } = useAdminTenant();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h1>{tenantConfig?.name}</h1>
      <p style={{ color: tenantConfig?.branding?.primaryColor }}>
        Brend rəngində mətn
      </p>
    </div>
  );
}
```

### Əsas fayllar

| Fayl | Məsuliyyət |
|------|-----------|
| `src/lib/auth.ts` | NextAuth config — login + tenant slug resolution |
| `src/types/next-auth.d.ts` | Session/JWT type genişləndirilməsi |
| `src/lib/tenant.ts` | `fetchTenantById()` — tenantId → slug/name çevrilməsi |
| `src/hooks/use-admin-tenant.ts` | React hook — admin-in tenant config-ini fetch edir |
| `src/lib/api/admin.ts` | Admin API funksiyaları (CRUD + tenant config) |
| `src/components/admin/AdminSidebar.tsx` | Sidebar — tenant logo, ad, publik menyu linki |
| `src/app/admin/page.tsx` | Dashboard — tenant-a xas statistika |

---

## Problemlərin həlli

| Problem | Səbəb | Həll |
|---------|-------|------|
| `/az/pubzade` 404 göstərir | API-də `pubzade` tenant yoxdur | Backend-ə tenant əlavə edin və ya `seedTenants`-ə yazın |
| Menyu yüklənmir | `menuApiUrl` yanlışdır | Tenant config-dəki URL-i yoxlayın |
| Tenant datası köhnə qalıb | 60 saniyə keş | `REVALIDATE_SECONDS` dəyərini azaldın və ya dev serveri restart edin |
| Xarici API işləmir | `TENANT_API_URL` yanlışdır | `.env.local`-dakı URL-i yoxlayın, backend-in ayaqda olduğunu təsdiqləyin |
| Xarici API əlçatmaz olduqda | Network xətası | Avtomatik olaraq local seed data-ya fallback edir |
| Slug qəbul olunmur | Format səhvdir | Yalnız kiçik hərf, rəqəm, tire: `my-tenant` ✅, `My Tenant` ❌ |
| Sitemap-da yeni tenant yoxdur | API cavabında yoxdur | `GET /api/tenants` endpointinin düzgün siyahı qaytardığını yoxlayın |
| Admin-da tenant adı görünmür | `tenantSlug` session-da boşdur | Login olduqda tenant resolve uğursuz olub — `fetchTenantById` loq-ları yoxlayın |
| Admin başqa tenant-ın datasını görür | Backend filtri yoxdur | Backend API-nin auth token-ə görə filtrlədiyini təsdiq edin |
| "Menyuya bax" linki yoxdur | `tenantSlug` boşdur | Tenant-ın public API-də mövcud olduğunu yoxlayın |

### Debug üçün faydalı URL-lər

```bash
# Bütün tenant-ları yoxla
curl http://localhost:3000/api/tenants

# Tək tenant yoxla
curl http://localhost:3000/api/tenants/walvero

# Olmayan tenant
curl http://localhost:3000/api/tenants/bilinmeyen
# → {"error":"Tenant not found","slug":"bilinmeyen"}

# Sitemap-ı yoxla
curl http://localhost:3000/sitemap.xml

# Tenant səhifəsini yoxla
open http://localhost:3000/az/walvero
```
