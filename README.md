# Menu App — Next.js

A modern, multi-tenant, multi-language restaurant menu platform built with **Next.js 15**, **App Router**, **Tailwind CSS 4**, and **TypeScript**.

## Features

- **Next.js App Router** with `src/` directory structure
- **i18n** — Azerbaijani (default), English, Russian with locale-segment routing
- **Multi-tenancy** — path-based tenant routing (`/{locale}/{tenant}/...`)
- **Modern SaaS Home Page** — hero, features, how-it-works, testimonials, pricing, footer
- **SEO** — metadata API, Open Graph, Twitter Cards, JSON-LD, `sitemap.xml`, `robots.txt`, canonical + hreflang
- **Middleware** — auto-redirect `/` → `/az/walvero`, Accept-Language detection, tenant enforcement
- **Preserved Tailwind CSS** styling and all existing custom animations

## Route Map

| Path                              | Description            |
| --------------------------------- | ---------------------- |
| `/`                               | → redirects to `/az/walvero` |
| `/{locale}`                       | → redirects to `/{locale}/walvero` |
| `/{locale}/{tenant}`              | Home page (SaaS landing) |
| `/{locale}/{tenant}/restaurant`   | Restaurant info page   |
| `/{locale}/{tenant}/menu`         | Menu page with cart     |
| `/{locale}/{tenant}/checkout`     | Checkout page           |

Locales: `az`, `en`, `ru`  
Default tenant: `walvero`

## Getting Started

### Prerequisites

- Node.js 18.17+ (recommended: 20+)
- npm 9+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/az/walvero`.

### Build

```bash
npm run build
```

### Start (production)

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout
│   ├── robots.ts                           # robots.txt generation
│   ├── sitemap.ts                          # sitemap.xml generation
│   └── [locale]/
│       ├── layout.tsx                      # Locale layout (html lang)
│       └── [tenant]/
│           ├── layout.tsx                  # Tenant layout (providers)
│           ├── page.tsx                    # Home page (SaaS landing)
│           ├── HomePageClient.tsx
│           ├── restaurant/
│           │   ├── page.tsx
│           │   └── RestaurantPageClient.tsx
│           ├── menu/
│           │   ├── page.tsx
│           │   └── MenuPageClient.tsx
│           └── checkout/
│               ├── page.tsx
│               └── CheckoutPageClient.tsx
├── components/
│   ├── providers/
│   │   ├── LocaleProvider.tsx
│   │   └── TenantProvider.tsx
│   ├── LanguageSwitcher.tsx
│   ├── RestaurantHeader.tsx
│   ├── CheckoutModal.tsx
│   ├── RatingModal.tsx
│   ├── LoadingState.tsx
│   └── ErrorState.tsx
├── i18n/
│   ├── config.ts
│   ├── types.ts
│   ├── get-dictionary.ts
│   └── dictionaries/
│       ├── az.ts
│       ├── en.ts
│       └── ru.ts
├── lib/
│   └── tenant.ts
└── styles/
    └── globals.css
middleware.ts                               # Locale/tenant routing middleware
```

## Adding a New Tenant

1. Add a new entry in `src/lib/tenant.ts` → `tenants` object.
2. Provide a `menu.json` or API URL for the tenant.
3. The tenant is automatically available at `/{locale}/{tenantSlug}`.

## Adding a New Language

1. Add the locale code to `src/i18n/config.ts` → `locales` array.
2. Create a new dictionary file in `src/i18n/dictionaries/{locale}.ts`.
3. Add the import in `src/i18n/get-dictionary.ts`.
