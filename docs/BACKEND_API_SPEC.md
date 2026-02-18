# Backend API Spesifikasiyası

> Bu sənəd Next.js frontend tərəfinin düzgün işləməsi üçün backend-dən tələb olunan **bütün endpointləri**, cavab formatlarını və davranış qaydalarını təsvir edir.

## Base URL

Frontend `.env` faylında bu dəyişəni istifadə edir:

```
TENANT_API_URL=https://api.walvero.com/v1/tenants
```

Bütün tenant endpointləri bu base URL-ə nisbətən çağırılır.
Menyu/restoran datası isə tenant config-dəki `menuApiUrl` sahəsindən oxunur.

---

## Endpoint xülasəsi

| # | Method | Endpoint | Təsvir | Frontend harada istifadə edir |
|---|--------|----------|--------|-------------------------------|
| 1 | `GET` | `/tenants` | Bütün aktiv tenant-ları qaytarır | Sitemap generasiyası, `/api/tenants` proxy |
| 2 | `GET` | `/tenants/{slug}` | Slug üzrə tək tenant qaytarır | Hər səhifə yüklənəndə (layout, metadata) |
| 3 | `GET` | `{menuApiUrl}` | Tenantın restoran + menyu datası | Restoran səhifəsi, Menyu səhifəsi |

---

## 1. Bütün tenant-ları siyahıla

```
GET /tenants
```

### Təsvir
Bütün aktiv tenant-ları qaytarır. Sitemap (`sitemap.xml`) generasiyası və admin paneli üçün istifadə olunur.

### Cavab: `200 OK`

```json
[
  {
    "id": "walvero",
    "name": "Walvero",
    "slug": "walvero",
    "description": "Digital menu platform for modern restaurants",
    "logo": null,
    "primaryColor": "#1c1917",
    "domain": "walvero.com",
    "menuApiUrl": "https://api.walvero.com/v1/restaurants/walvero"
  },
  {
    "id": "pubzade",
    "name": "Pubzade",
    "slug": "pubzade",
    "description": "Traditional Azerbaijani restaurant in Baku",
    "logo": "https://cdn.walvero.com/tenants/pubzade/logo.png",
    "primaryColor": "#78350f",
    "domain": "pubzade.az",
    "menuApiUrl": "https://api.walvero.com/v1/restaurants/pubzade"
  }
]
```

### Qeydlər
- Yalnız `active = true` olan tenant-ları qaytarın
- Sıralama: `created_at ASC` və ya `name ASC`
- Boş siyahı halında `[]` qaytarın (200, boş array)

---

## 2. Tək tenant götür (slug üzrə)

```
GET /tenants/{slug}
```

### Parametrlər

| Parametr | Yer | Tip | Tələb | Təsvir |
|----------|-----|-----|-------|--------|
| `slug` | path | string | Bəli | Tenant-ın unikal URL identifikatoru |

### Cavab: `200 OK` (tenant tapıldı)

```json
{
  "id": "pubzade",
  "name": "Pubzade",
  "slug": "pubzade",
  "description": "Traditional Azerbaijani restaurant in Baku",
  "logo": "https://cdn.walvero.com/tenants/pubzade/logo.png",
  "primaryColor": "#78350f",
  "domain": "pubzade.az",
  "menuApiUrl": "https://api.walvero.com/v1/restaurants/pubzade"
}
```

### Cavab: `404 Not Found` (tenant yoxdur)

```json
{
  "error": "Tenant not found",
  "slug": "bilinmeyen"
}
```

### TenantConfig sahələri

| Sahə | Tip | Tələb | Təsvir |
|------|-----|-------|--------|
| `id` | string | Bəli | Unikal identifikator (UUID və ya slug) |
| `name` | string | Bəli | Göstərilən ad — naviqasiya, footer, SEO title-da istifadə olunur |
| `slug` | string | Bəli | URL seqmenti. Yalnız `[a-z0-9-]`, 2-50 simvol. Unikal olmalıdır |
| `description` | string | Bəli | Qısa təsvir (SEO description üçün istifadə oluna bilər) |
| `logo` | string \| null | Xeyr | Logo şəkil URL-i (tam URL). `null` ola bilər |
| `primaryColor` | string | Bəli | Hex rəng kodu, `#` ilə başlayır. Məsələn: `"#1c1917"` |
| `domain` | string \| null | Xeyr | Xüsusi domain adı. Gələcək üçün. `null` ola bilər |
| `menuApiUrl` | string | Bəli | Bu tenant-ın restoran+menyu datasının URL-i (Endpoint 3) |

### Slug qaydaları
- Yalnız kiçik latın hərfləri, rəqəmlər, tire: `pubzade`, `nargile-lounge`, `cafe123`
- Boşluq, böyük hərf, xüsusi simvol qadağandır
- Bu adlar slug olaraq istifadə edilə bilməz (rezerv olunub): `api`, `restaurant`, `menu`, `checkout`, `_next`, `sitemap`, `robots`

---

## 3. Restoran + menyu datası

```
GET {menuApiUrl}
```

Bu URL tenant config-dəki `menuApiUrl` sahəsindən gəlir.
Məsələn: `https://api.walvero.com/v1/restaurants/pubzade`

### Təsvir
Verilmiş tenant-ın restoran məlumatlarını və tam menyu kateqoriyalarını qaytarır. Frontend bu endpointi **iki yerdə** istifadə edir:
1. **Restoran səhifəsi** — restoran adı, şəkil, reytinq, WiFi, əlaqə, yer
2. **Menyu səhifəsi** — restoran header + bütün kateqoriya və məhsullar

### Cavab: `200 OK`

```json
{
  "restaurant": {
    "image": "https://cdn.walvero.com/restaurants/pubzade/cover.jpg",
    "name": "Pubzade",
    "rating": 4.7,
    "address": "45 Nizami St, Baku",
    "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "workingHours": "11:00 - 23:00",
    "phone": "+994552993888",
    "wifi": {
      "ssid": "PubzadeGuest",
      "password": "pubzade2026"
    },
    "googleLocation": "https://maps.app.goo.gl/AfgjiPnJDzs2gcSr8",
    "wazeLocation": "https://waze.com/ul/htp5mtwcxy",
    "categories": [
      {
        "id": "starters",
        "name": "Starters",
        "items": [
          {
            "id": "st-1",
            "name": "Badimcan Salati",
            "description": "Grilled eggplant, tomato, garlic, herbs",
            "price": 6,
            "currencySign": "₼",
            "currency": "AZN",
            "prepTimeMinutes": 8,
            "image": "https://cdn.walvero.com/items/badimcan.jpg"
          },
          {
            "id": "st-2",
            "name": "Pomidor Xiyar Salati",
            "description": "Tomato, cucumber, onion, sumac",
            "price": 7,
            "currencySign": "₼",
            "currency": "AZN",
            "prepTimeMinutes": 9,
            "image": "https://cdn.walvero.com/items/pomidor.jpg"
          }
        ]
      },
      {
        "id": "mains",
        "name": "Mains",
        "items": [
          {
            "id": "mn-1",
            "name": "Shah Plov",
            "description": "Saffron rice, lamb, dried fruit",
            "price": 14,
            "currencySign": "₼",
            "currency": "AZN",
            "prepTimeMinutes": 20,
            "image": "https://cdn.walvero.com/items/shah-plov.jpg"
          }
        ]
      }
    ]
  }
}
```

### `restaurant` obyekti sahələri

| Sahə | Tip | Tələb | Təsvir |
|------|-----|-------|--------|
| `image` | string | Bəli | Restoran əsas şəkli (cover photo). Tam URL |
| `name` | string | Bəli | Restoran adı |
| `rating` | number | Bəli | Reytinq (1.0 – 5.0 arası) |
| `address` | string | Bəli | Tam ünvan |
| `workingDays` | string[] | Xeyr | İş günləri. `["Mon","Tue",...]` |
| `workingHours` | string | Xeyr | İş saatları. `"11:00 - 23:00"` |
| `phone` | string | Bəli | Telefon nömrəsi. Beynəlxalq format: `"+994552993888"` |
| `wifi` | object | Bəli | WiFi məlumatları (aşağıya bax) |
| `wifi.ssid` | string | Bəli | WiFi şəbəkə adı |
| `wifi.password` | string | Bəli | WiFi şifrəsi |
| `googleLocation` | string | Bəli | Google Maps linki (tam URL) |
| `wazeLocation` | string | Bəli | Waze linki (tam URL) |
| `categories` | array | Bəli | Menyu kateqoriyaları (aşağıya bax) |

### `categories[*]` sahələri

| Sahə | Tip | Tələb | Təsvir |
|------|-----|-------|--------|
| `id` | string | Bəli | Unikal kateqoriya ID-si. Scroll navigation üçün istifadə olunur |
| `name` | string | Bəli | Kateqoriya adı (göstərilən) |
| `items` | array | Bəli | Kateqoriyadakı məhsullar |

### `categories[*].items[*]` sahələri

| Sahə | Tip | Tələb | Təsvir |
|------|-----|-------|--------|
| `id` | string | Bəli | Unikal məhsul ID-si. Səbət idarəsi üçün istifadə olunur |
| `name` | string | Bəli | Məhsul adı |
| `description` | string | Bəli | Qısa təsvir (1-2 cümlə) |
| `price` | number | Bəli | Qiymət (rəqəm, valyuta simvolu ayrıdır). Məsələn: `6`, `14.5` |
| `currencySign` | string | Bəli | Valyuta simvolu. Məsələn: `"₼"`, `"$"`, `"€"` |
| `currency` | string | Bəli | ISO valyuta kodu. Məsələn: `"AZN"`, `"USD"` |
| `prepTimeMinutes` | number | Bəli | Hazırlıq müddəti (dəqiqə ilə) |
| `image` | string | Bəli | Məhsul şəkli (tam URL) |

---

## Ümumi qaydalar

### HTTP Status kodları

| Kod | Mənası | Harada |
|-----|--------|--------|
| `200` | Uğurlu | Bütün uğurlu sorğular |
| `404` | Tapılmadı | Tenant və ya restoran mövcud deyil |
| `500` | Server xətası | Backend xətası. Frontend local fallback-a keçir |

### CORS

Frontend fərqli domain-dən sorğu göndərə bilər. CORS header-lər lazımdır:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Və ya konkret domain üçün:
```
Access-Control-Allow-Origin: https://walvero.com
```

### Cache header-ləri (tövsiyə)

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

Frontend öz tərəfində 60 saniyə keşləyir, amma backend tərəfdə də cache qoymaq tövsiyə olunur.

### Content-Type

Bütün cavablar:
```
Content-Type: application/json; charset=utf-8
```

---

## Database cədvəl nümunəsi (PostgreSQL)

```sql
-- Tenant-lar
CREATE TABLE tenants (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT DEFAULT '',
    logo            VARCHAR(500),
    primary_color   VARCHAR(7) DEFAULT '#1c1917',
    domain          VARCHAR(200),
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Restoranlar (hər tenant-ın 1 restoranı)
CREATE TABLE restaurants (
    id                VARCHAR(50) PRIMARY KEY,
    tenant_id         VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    name              VARCHAR(200) NOT NULL,
    image             VARCHAR(500) NOT NULL,
    rating            DECIMAL(2,1) DEFAULT 0.0,
    address           VARCHAR(300) NOT NULL,
    working_days      TEXT[] DEFAULT '{}',
    working_hours     VARCHAR(50),
    phone             VARCHAR(20) NOT NULL,
    wifi_ssid         VARCHAR(100),
    wifi_password     VARCHAR(100),
    google_location   VARCHAR(500),
    waze_location     VARCHAR(500),
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id)
);

-- Menyu kateqoriyaları
CREATE TABLE categories (
    id              VARCHAR(50) PRIMARY KEY,
    restaurant_id   VARCHAR(50) REFERENCES restaurants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    sort_order      INT DEFAULT 0,
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Menyu məhsulları
CREATE TABLE menu_items (
    id                  VARCHAR(50) PRIMARY KEY,
    category_id         VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
    name                VARCHAR(200) NOT NULL,
    description         TEXT DEFAULT '',
    price               DECIMAL(10,2) NOT NULL,
    currency_sign       VARCHAR(5) DEFAULT '₼',
    currency            VARCHAR(3) DEFAULT 'AZN',
    prep_time_minutes   INT DEFAULT 10,
    image               VARCHAR(500) NOT NULL,
    sort_order          INT DEFAULT 0,
    active              BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- İndekslər
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id, sort_order);
CREATE INDEX idx_menu_items_category ON menu_items(category_id, sort_order);
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE active = true;
```

---

## Test ssenarisi

Backend hazır olduqda bu addımlarla test edə bilərsiniz:

```bash
# 1. Bütün tenant-ları al
curl -s https://api.walvero.com/v1/tenants | jq

# 2. Tək tenant al
curl -s https://api.walvero.com/v1/tenants/walvero | jq

# 3. Olmayan tenant (404 gözlənilir)
curl -s -w "\nHTTP Status: %{http_code}\n" https://api.walvero.com/v1/tenants/yoxdur

# 4. Restoran + menyu datası
curl -s https://api.walvero.com/v1/restaurants/walvero | jq

# 5. Frontend-i xarici API ilə işə sal
# .env.local faylına əlavə et:
#   TENANT_API_URL=https://api.walvero.com/v1/tenants
# Sonra:
npm run dev
# http://localhost:3000/az/walvero açın — API-dən data gəlməlidir
```
