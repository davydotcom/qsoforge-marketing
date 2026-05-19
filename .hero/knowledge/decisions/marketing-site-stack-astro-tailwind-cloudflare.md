---
type: decision
status: accepted
tags: [stack, marketing, astro, tailwind, cloudflare-pages]
relates-to: [marketing-site-v1]
created: 2026-05-18
---

# Marketing site stack: Astro + Tailwind, deployed to Cloudflare Pages

## Context

QSO Forge needs a marketing website at `qsoforge.com` covering the company, the Damascus product (logging app, shipping), and teaser pages for two roadmap products (Tensile, Carbon). The site is content-heavy, low-interactivity, dark-themed, and must share visual identity with the Damascus desktop app (Rust + Slint). It is built and maintained by a solo founder, so the maintenance ceiling matters as much as the build experience. There is no need for SSR, no logged-in users, no commerce in v1, and content updates ship via git.

## Options considered

**Astro + Tailwind (chosen).** Static-first output, component model for shared header/footer/product cards, MDX support for product copy, built-in image optimization, TypeScript-native, single deploy artifact (`dist/`) with no runtime. Pros: zero hosting cost on Cloudflare Pages, no cold starts, great DX for a small site, easy for a Rust shop to read. Cons: lighter community than Next.js; image API has its own conventions to learn.

**Next.js + Tailwind.** Mature, ubiquitous, great image and font tooling. Pros: huge ecosystem, instantly familiar to most web devs. Cons: SSR runtime is unjustified — no logged-in users or per-request data; Vercel hosting introduces usage-based billing risk; operational surface (server runtime, edge runtime, ISR semantics) is overkill for ~7 static pages; bundle size and hydration overhead hurt Lighthouse for what is fundamentally a brochure site.

**Eleventy + plain CSS.** Lightweight, fast, no JS by default. Pros: minimal dependencies, very small output. Cons: thinner batteries — no first-class TS, no built-in image optimization, components are less ergonomic than Astro's `.astro` files. Time saved at scaffolding gets repaid in plumbing across image handling, OG tags, and sitemap.

**Plain HTML + a build script.** Maximum simplicity. Cons: cannot share a header/footer/product card across pages without inventing templating; the site genuinely needs component reuse.

## Decision

Use **Astro + Tailwind CSS**, deployed to **Cloudflare Pages** via a GitHub Actions workflow on push to `main`. Pin Node 20 LTS. Mirror the Damascus Slint color palette in a single `src/styles/tokens.css` so design tokens stay synchronized across product and marketing surfaces.

## Consequences

**Easier:** Zero runtime hosting cost. Global CDN delivery with no cold starts. Per-page Lighthouse scores ≥95 are achievable without custom optimization work. Adding new product pages is a copy-and-edit of an existing `.astro` file. Design tokens flow naturally between Damascus and the marketing site through a single CSS file.

**Harder:** Any future need for authenticated content, dynamic personalization, or per-request server logic would require either (a) Cloudflare Pages Functions, which is a workable escape hatch but adds operational surface, or (b) a stack change. If a real CMS is ever needed, content currently lives in `.astro`/`.mdx` files and would have to be migrated. The Astro ecosystem is smaller than Next.js, so unusual integrations may require more bespoke work.

**Watch for:** Drift between Damascus's Slint theme and the marketing tokens file. The README must document the synchronization contract so a Damascus palette change doesn't silently leave the marketing site stale.
