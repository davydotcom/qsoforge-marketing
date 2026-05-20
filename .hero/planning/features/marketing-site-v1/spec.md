---
title: QSO Forge marketing website (v1)
type: feature
status: planning
priority: high
tags: [marketing, brand, astro, greenfield, commerce]
relates-to:
  - damascus-fulfillment-pipeline
created: 2026-05-18
---

# QSO Forge marketing website (v1)

## Context

QSO Forge, LLC is a new amateur-radio software company. The domain `qsoforge.com` is registered and needs a marketing site that introduces the company, positions the first shipping product (Damascus — the ham radio logging app, currently in M1), and reserves stage space for two follow-on products on the roadmap (Tensile — a repeater directory; Carbon — a WebSDR). The product line follows a metallurgy / materials-science naming theme that pairs cleanly with a McLaren-inspired visual identity (papaya orange + green accents on layered near-black surfaces).

This is a greenfield repository: `/home/destes/projects/davydotcom/qso-marketing` currently contains only `.hero/` and `AGENTS.md`. The sibling repo `/home/destes/projects/davydotcom/qso-forge` holds the Damascus source, its README (product copy source-of-truth), and its Slint theme file (`crates/ui/ui/theme.slint`), which is the authoritative color palette this site must match so the marketing surface feels visually continuous with the app.

There is no tracker configured for this repo; the spec is the source of truth. There is no real logo yet — the current placeholder is an orange rounded-square "QF" monogram at `../qso-forge/packaging/icons/qsoforge.png`. A real wordmark is a known gap and is captured in Risks; the site must reserve the brand-mark slot without blocking on it.

## Goal

Ship a static, fast, dark-themed marketing site at `qsoforge.com` that (1) introduces QSO Forge as a serious, engineering-quality-first ham-radio software company, (2) gives Damascus a credible product page with platform support, feature highlights, a free Download CTA routing to the latest GitHub Release, and a Buy CTA routing to the Lemon Squeezy hosted checkout at the **$25 founder price** (rising to $50 at Damascus 1.0), (3) holds teaser pages for Tensile and Carbon with email capture, (4) renders cleanly across 360px–1920px viewports, scores ≥95 on all Lighthouse categories for the home page, and (5) shares design tokens with the Damascus app so the visual identity is consistent across product and marketing surfaces. The site deploys to Cloudflare Pages from a GitHub Actions workflow on push to `main`.

Commerce on the site is intentionally thin: the Buy CTA links to a Lemon Squeezy hosted checkout (LS is the merchant of record), and a `/recover-license` page lets a customer re-trigger delivery of their license bundle. All the heavy lifting — webhook handling, ed25519 bundle signing, transactional email — lives in `damascus-fulfillment-pipeline` (a sibling spec) as Cloudflare Pages Functions deployed alongside this site.

## Kickoff

Marketing site for QSO Forge — home + Damascus product page + Tensile/Carbon coming-soon teasers, Astro static build deployed to Cloudflare Pages.

**Status:** planning — spec just landed, repo is empty except `.hero/` and `AGENTS.md`. No code yet.

**Pick up at:** scaffold the Astro project per `## Changes` step 1–3 (package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json), then drop in the design tokens from `theme.slint` before building any pages.

→ `/home/destes/projects/davydotcom/qso-marketing/.hero/planning/features/marketing-site-v1/spec.md`

**Files:** `/home/destes/projects/davydotcom/qso-marketing/.hero/planning/features/marketing-site-v1/spec.md`, `/home/destes/projects/davydotcom/qso-forge/crates/ui/ui/theme.slint`, `/home/destes/projects/davydotcom/qso-forge/README.md`
**Skip:** Next.js (SSR overkill, runtime cost), commerce/pricing flow (apps aren't sold yet — v2 conversation).

## Approach

**Stack: Astro 6 + Tailwind CSS 4 (via PostCSS), deployed to Cloudflare Pages.**

Astro is the right choice here for five concrete reasons: (1) static-first output means no server runtime, no cold starts, and a CDN-only deploy target; (2) component model (`.astro` files) supports the small amount of reuse the site needs (product cards, feature grids, platform badges) without React's runtime cost; (3) MDX support keeps product copy editable as prose rather than JSX; (4) built-in image optimization handles screenshots cleanly; (5) it's TypeScript-native, matching the Rust shop's preference for typed tooling.

**Stack version pinning:** Astro 6 (latest stable; 4.x has active CVEs including auth bypasses and reflected XSS, ruled out as a starting point for a new repo). Tailwind 4 is the native pairing with Astro 6, integrated via PostCSS (`@tailwindcss/postcss`) rather than the `@tailwindcss/vite` plugin — the latter has a known incompatibility with Astro 6's Rolldown bundler that surfaces as a `BindingViteResolvePluginConfig.resolveOptions` error at build time. The PostCSS path is stable and well-tested. Tailwind 4's CSS-first config model means there's no `tailwind.config.mjs`; design tokens are declared in a CSS `@theme {}` block (in `src/styles/tokens.css`) and Tailwind synthesizes both the CSS custom properties and the matching utility classes from that one source.

Alternatives rejected: **Next.js** is overkill — no SSR is needed, the server runtime adds hosting cost and operational surface, and its image/router complexity is unjustified for ~7 pages. **Eleventy** is lighter but less batteries-included around components, image optimization, and TS — the time saved at scaffolding gets repaid in plumbing. **Plain HTML** can't share a header/footer/product card across pages without templating, which the site genuinely needs.

**Hosting: Cloudflare Pages.** Free tier covers traffic comfortably, global anycast CDN, no cold starts, edge config for redirects, and a clean GitHub integration. Vercel is a viable fallback but adds usage-based billing risk; Cloudflare is the call for v1.

**Information architecture:**
- `/` — Hero with QSO Forge positioning, product grid (Damascus available; Tensile + Carbon "coming soon"), brand statement, footer CTA. Primary CTA `Download Damascus` (free), secondary `Buy license — $25`.
- `/damascus` — Product page: hero, feature grid, platform support matrix, UI screenshot strip, **Download** CTA (free, points at `/damascus/download`) alongside a **Buy** CTA (Lemon Squeezy checkout). Free-evaluation messaging: "Free 30-day evaluation — no signup, no email, full features." Install command snippets. (No link to a GitHub repo — the qso-forge source is private; binaries are distributed via Cloudflare R2, not GitHub Releases.)
- `/damascus/download` — Per-platform download page. Lists each binary on `releases.qsoforge.com` (R2-hosted) with file size and SHA256, auto-detects the visitor's OS and highlights the matching row, and shows the current Damascus version + release date sourced from the manifest.
- `/pricing` — Pricing page. Damascus card at $25 founder price (with explicit "pre-1.0 pricing — rises to $50 at 1.0; founder licenses remain perpetual"), Tensile and Carbon "coming soon" cards.
- `/thanks` — Post-checkout confirmation: "Your license bundle is on its way. Watch for an email within 24 hours. Lost it? [recover-license link]."
- `/recover-license` — Single-input form for re-delivery; posts to `/api/recover-license` (handler ships in `damascus-fulfillment-pipeline`).
- `/tensile` — Coming-soon teaser with email signup (Buttondown).
- `/carbon` — Coming-soon teaser with email signup (Buttondown).
- `/about` — Company mission, principles, founder bio placeholder.
- `/legal/privacy` and `/legal/terms` — placeholder copy (flagged in Risks).
- `404.astro`.

**Design tokens:** A single `src/styles/tokens.css` mirrors the Damascus `theme.slint` palette (papaya `#FF8000`, green `#27F08A`, surface layers `#0A0A0A`/`#141414`/`#1C1C1C`, text `#FFFFFF`/`#B8B8B8`, border `#2A2A2A`, status colors, 4px spacing grid, mono font for technical content). Tailwind's theme extends from these tokens so utility classes stay on-brand and future apps can adopt the same file verbatim.

**Latest-release fetch:** Build-time only. `src/lib/releases.ts` fetches `https://releases.qsoforge.com/damascus/latest.json` — a release manifest published to a Cloudflare R2 bucket by the qso-forge release pipeline (separate spec in the qso-forge repo). The manifest shape:

```json
{
  "version": "0.5.0",
  "name": "Damascus 0.5.0",
  "published_at": "2026-05-15T12:00:00Z",
  "release_notes_url": "https://releases.qsoforge.com/damascus/v0.5.0/RELEASE_NOTES.md",
  "assets": [
    { "platform": "linux-deb",      "arch": "x86_64", "url": "https://releases.qsoforge.com/damascus/v0.5.0/damascus-0.5.0-x86_64.deb",            "size": 12345678, "sha256": "..." },
    { "platform": "linux-rpm",      "arch": "x86_64", "url": "https://releases.qsoforge.com/damascus/v0.5.0/damascus-0.5.0-x86_64.rpm",            "size": 12345678, "sha256": "..." },
    { "platform": "linux-appimage", "arch": "x86_64", "url": "https://releases.qsoforge.com/damascus/v0.5.0/damascus-0.5.0-x86_64.AppImage",       "size": 12345678, "sha256": "..." },
    { "platform": "linux-arch",     "arch": "x86_64", "url": "https://releases.qsoforge.com/damascus/v0.5.0/damascus-0.5.0-x86_64.pkg.tar.zst",    "size": 12345678, "sha256": "..." },
    { "platform": "windows-msi",    "arch": "x86_64", "url": "https://releases.qsoforge.com/damascus/v0.5.0/damascus-0.5.0-x86_64.msi",            "size": 12345678, "sha256": "..." }
  ]
}
```

The result is cached in `src/data/release.json` and consumed by `/damascus`, `/damascus/download`, and `<DownloadButton>` for the version, release date, and per-platform URLs. If the manifest fetch fails, the build falls back to the existing snapshot — builds never break on a flaky CDN. The manifest URL is configurable via `PUBLIC_RELEASES_MANIFEST_URL` so staging/preview can point at a non-production manifest.

**Why R2 instead of GitHub Releases:** the qso-forge source repo is private (paid proprietary app); private-repo release assets require authentication, so anonymous visitor downloads don't work via GitHub. Cloudflare R2 with public-read on `releases.qsoforge.com` provides anonymous downloads, zero egress fees within Cloudflare, no GitHub API rate limit, and a clean custom-domain URL. The release-publishing pipeline lives in the qso-forge repo (build on tag, upload artifacts to R2, write `latest.json` and `v<version>/...` paths) and is a separate spec.

**Forms:** `<ComingSoonForm>` posts to a Buttondown endpoint via `fetch`, shows inline success/error messaging, and never causes a full-page reload. The Buttondown URL is read from an environment variable so the same component is reused across `/tensile` and `/carbon`.

**Analytics:** Cloudflare Web Analytics — free, no cookies, no consent banner needed, and a single script tag. Plausible is the alternative if richer dashboards become necessary; that's a swap, not a rewrite.

**SEO + social:** Per-page `<title>`, meta description, OpenGraph + Twitter card meta tags. For v1, ship one hand-crafted `og.png` per page under `public/og/` — simple, no build-time image generation dependency. Sitemap and `robots.txt` are generated via `@astrojs/sitemap`.

## Acceptance Criteria

- THE SYSTEM SHALL render `/`, `/damascus`, `/tensile`, `/carbon`, `/about`, `/legal/privacy`, `/legal/terms`, and a 404 page with no console errors.
- THE SYSTEM SHALL match the Damascus app's color palette (papaya `#FF8000`, green `#27F08A`, layered `#0A0A0A`/`#141414`/`#1C1C1C` surfaces) on every page.
- WHEN a visitor clicks the Damascus Download CTA on `/` or `/damascus`, THE SYSTEM SHALL navigate to `/damascus/download`, which lists per-platform binaries hosted on `releases.qsoforge.com` (Cloudflare R2).
- WHEN the site is built, THE SYSTEM SHALL fetch the release manifest from `PUBLIC_RELEASES_MANIFEST_URL` (default `https://releases.qsoforge.com/damascus/latest.json`) and embed the version, release date, and per-platform download URLs on `/damascus` and `/damascus/download`.
- IF the manifest fetch fails during build, THEN THE SYSTEM SHALL fall back to the cached `src/data/release.json` snapshot and complete the build.
- WHEN a visitor's user-agent indicates a platform represented in the manifest, THE SYSTEM SHALL visually highlight the matching row on `/damascus/download` (Linux/macOS/Windows family detection only; finer-grained distro detection is out of scope).
- WHEN a visitor submits the Tensile or Carbon "notify me" form THE SYSTEM SHALL POST the email to the configured Buttondown endpoint and display a success message inline without a full-page reload.
- THE SYSTEM SHALL achieve Lighthouse scores ≥ 95 on performance, accessibility, best-practices, and SEO for the home page on a standard mobile-throttled run.
- THE SYSTEM SHALL pass WCAG AA color-contrast checks on body text and CTA buttons against the dark surface.
- THE SYSTEM SHALL render responsively from 360px to 1920px wide without horizontal scroll.
- WHERE the visitor has `prefers-reduced-motion` set THE SYSTEM SHALL suppress non-essential animations.
- THE SYSTEM SHALL include OpenGraph and Twitter card meta tags with a per-page OG image so links unfurl cleanly in Slack, Discord, and iMessage.
- WHEN a visitor clicks the Damascus Buy CTA on `/`, `/damascus`, or `/pricing`, THE SYSTEM SHALL navigate to the Lemon Squeezy hosted checkout URL configured in `PUBLIC_LS_DAMASCUS_CHECKOUT_URL`.
- THE SYSTEM SHALL display the current Damascus price (sourced from a single config constant) consistently across `/`, `/damascus`, and `/pricing`; raising the price at Damascus 1.0 must be a one-file change.
- THE SYSTEM SHALL render `/recover-license` with no client-side dependency on the fulfillment worker — if the worker is offline, the form submits and the page reports a clear error rather than crashing.

## Changes

Execute these in order. Each step names every file or directory to create.

1. **Initialize the Node/Astro project root.**
   - Create `package.json` with `"type": "module"`, scripts `dev`, `build`, `preview`, `astro`, and dependencies: `astro ^6`, `@astrojs/sitemap ^3.5`, `@astrojs/mdx ^5`, `tailwindcss ^4`, `@tailwindcss/postcss ^4`. Dev: `typescript ^5`.
   - Create `.nvmrc` pinning Node 22 LTS (Astro 6 dropped Node 20 support; 22 is current LTS).
   - Create `.gitignore` covering `node_modules/`, `dist/`, `.astro/`, `.env`, `.env.*` (except `.env.example`), `.wrangler/`, `.DS_Store`. (The Hero-managed block already lives in this file; append the Node/Astro block above it without touching the managed block.)
   - Create `.env.example` with placeholders for `PUBLIC_BUTTONDOWN_ENDPOINT`, `PUBLIC_CF_ANALYTICS_TOKEN`, `PUBLIC_LS_DAMASCUS_CHECKOUT_URL`, `PUBLIC_DAMASCUS_PRICE_USD` (default `25`), and `PUBLIC_RELEASES_MANIFEST_URL` (default `https://releases.qsoforge.com/damascus/latest.json`).

2. **Astro + TypeScript + Tailwind configuration.**
   - Create `astro.config.mjs` — register `@astrojs/mdx` and `@astrojs/sitemap`, set `site: "https://qsoforge.com"`, set `output: "static"`. Tailwind is wired via PostCSS, not an Astro integration, so it does not appear here.
   - Create `postcss.config.mjs` registering `@tailwindcss/postcss` as the single plugin.
   - Create `tsconfig.json` extending `astro/tsconfigs/strict`.
   - **No `tailwind.config.mjs`.** Tailwind 4 reads its theme from the `@theme` block in CSS (step 3); a JS config file is not part of the v4 model.

3. **Design tokens shared with the Damascus app.**
   - Create `src/styles/tokens.css` containing a single `@theme {}` block mirroring `../qso-forge/crates/ui/ui/theme.slint`:
     - Colors: `--color-surface-0` `#0a0a0a`, `--color-surface-1` `#141414`, `--color-surface-2` `#1c1c1c`, `--color-text` `#ffffff`, `--color-text-muted` `#b8b8b8`, `--color-accent` `#ff8000`, `--color-accent-alt` `#27f08a`, `--color-border` `#2a2a2a`, `--color-focus-ring` `#ff8000`, `--color-success` `#27f08a`, `--color-warning` `#ff8000`, `--color-error` `#ff4444`.
     - Fonts: `--font-sans` (system stack) and `--font-mono` (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`).
     - Tailwind 4 picks these up automatically: each token becomes both a CSS custom property (`var(--color-surface-0)`) and a utility class (`bg-surface-0`, `text-accent`, `text-accent-alt`, etc.). One source, two surfaces.
     - The 4px spacing scale is Tailwind's default (`1` = 4px, `2` = 8px, …) — no override needed.
   - Create `src/styles/global.css` that `@import "tailwindcss"`, `@import "./tokens.css"`, then declares `@layer base` rules: body background to `--color-surface-0`, text to `--color-text`, base typography, focus-visible outlines, and a `@media (prefers-reduced-motion: reduce)` block that disables transitions and animations.

4. **Layouts.**
   - Create `src/layouts/BaseLayout.astro` — `<html lang="en">`, `<head>` slot for per-page meta, includes global stylesheet, mounts `<SiteHeader>` and `<SiteFooter>`, accepts `title`, `description`, `ogImage`, and `path` props, emits OpenGraph and Twitter card meta tags.

5. **Shared components under `src/components/`.**
   - `SiteHeader.astro` — logo placeholder (`<img src="/logo.svg">`), primary nav (`Damascus`, `Tensile`, `Carbon`, `Pricing`, `About`), GitHub icon link to `https://github.com/davydotcom/qso-forge`, right-aligned `<BuyButton>` (compact variant).
   - `SiteFooter.astro` — copyright line "© QSO Forge, LLC", links to `/legal/privacy`, `/legal/terms`, GitHub.
   - `Hero.astro` — title, subtitle, optional CTA slot. Reused on `/` and product pages.
   - `ProductCard.astro` — props: `name`, `tagline`, `status` (`available` | `coming-soon`), `href`. Used in home product grid.
   - `FeatureGrid.astro` — wraps a responsive grid of `<FeatureCard>` children.
   - `FeatureCard.astro` — props: `title`, `body`, optional `icon` slot.
   - `PlatformBadge.astro` — props: `platform` (`windows` | `linux` | `macos`), `status` (`available` | `planned`). Renders pill with icon.
   - `DownloadButton.astro` — primary papaya CTA. Reads `release.json` for the current version string. Links to `/damascus/download` (per-platform listing). Compact variant on `/` links straight to `/damascus/download`.
   - `BuyButton.astro` — secondary papaya CTA. Props: `href` (defaults to `import.meta.env.PUBLIC_LS_DAMASCUS_CHECKOUT_URL`), `price` (from `PUBLIC_DAMASCUS_PRICE_USD`), `tier-label` (e.g. "founder pricing"). Renders "Buy license — $25 · founder pricing" style.
   - `PricingCard.astro` — product name, price, tier label, feature list slot, primary CTA slot. Used on `/pricing`.
   - `ComingSoonForm.astro` — email input + submit button. POSTs to `import.meta.env.PUBLIC_BUTTONDOWN_ENDPOINT` via `fetch`. Inline success/error message. No page reload.
   - `RecoverLicenseForm.astro` — email input + submit button. POSTs to `/api/recover-license` (handler in `damascus-fulfillment-pipeline`). Inline success/error message; the success message is generic ("If we have a record of that email, we've sent your license") to avoid enumeration.
   - `CodeBlock.astro` — mono font, surface-1 background, papaya highlights for command prompts. Used on `/damascus` for install snippets.

6. **Build-time release-manifest fetch.**
   - Create `src/lib/releases.ts` — async function `fetchReleaseManifest()` that GETs `PUBLIC_RELEASES_MANIFEST_URL` (default `https://releases.qsoforge.com/damascus/latest.json`), validates the shape (`version`, `published_at`, non-empty `assets[]`), writes the payload to `src/data/release.json`, and on failure returns the existing snapshot. Logs which path was taken (`manifest-live` vs `snapshot-fallback`).
   - Create `src/lib/release-types.ts` — TypeScript types matching the manifest schema. `Asset.platform` is `"linux-deb" | "linux-rpm" | "linux-appimage" | "linux-arch" | "windows-msi" | "macos-dmg"` (macos reserved for future).
   - Create `src/data/release.json` with a seed snapshot (placeholder version `0.0.0`, empty `assets: []`, `published_at` set to the spec date) so the first build succeeds offline. `/damascus/download` renders a "No releases yet — check back soon" state when assets are empty.
   - Wire `fetchReleaseManifest()` into a prebuild script: add `"prebuild": "node ./scripts/fetch-release.mjs"` to `package.json` and create `scripts/fetch-release.mjs` that invokes the lib and writes the JSON.
   - Document on `/damascus/download` (and in `README.md`) that anonymous downloads are served from `releases.qsoforge.com` — a Cloudflare R2 bucket fronted by a custom domain — not from GitHub.

7. **Pages under `src/pages/`.**
   - `index.astro` — Hero with company positioning, product grid using `<ProductCard>` for Damascus (available), Tensile (coming soon), Carbon (coming soon), short brand statement, footer CTA. Hero CTAs: primary `<DownloadButton>`, secondary `<BuyButton>`.
   - `damascus.astro` — Hero with product tagline, `<FeatureGrid>` covering daily logging, contesting, POTA, multi-station P2P field ops, ADIF I/O, WSJT-X integration, Cabrillo export, map view, DX spots, POTA spots, DUPE detection, multiple logbooks, operator switching, keyboard-driven workflow, first-class TUI. `<PlatformBadge>` row: Windows (MSI), Linux (.deb / .rpm / .AppImage / Arch pkg), macOS (planned). CTA row: `<DownloadButton>` (free, primary, links to `/damascus/download`) + `<BuyButton>` (secondary) with the line "Free 30-day evaluation — no signup. License unlocks beyond evaluation." `<CodeBlock>` examples for install commands per platform.
   - `damascus/download.astro` — Per-platform download page. Renders one row per asset in the manifest with: platform label, file size (human-readable), SHA256 hash (copy-button), direct `<a download>` link to the R2 URL. UA-sniff at render time to mark the matching row "Recommended for your system". Show current version + release date at the top.
   - `pricing.astro` — Page header "Pricing", three `<PricingCard>` instances: Damascus ($25 founder pricing, perpetual, primary CTA `<BuyButton>`), Tensile and Carbon ("Coming soon", `<ComingSoonForm>` slot). Below the cards: a short FAQ block — "Why $25?", "What happens at 1.0?", "Can I use my license on multiple machines?", "Refund policy" — answers anchored to the founder-pricing position and Damascus's offline-license model.
   - `thanks.astro` — Order confirmation page reached after Lemon Squeezy redirect. Body: "Thanks for buying Damascus. Your license bundle is on its way — watch for an email from `licenses@qsoforge.com` within 24 hours. Lost it? [recover-license link]." Reads `order` query param for display only (no server lookup).
   - `recover-license.astro` — Single `<RecoverLicenseForm>`, brief copy explaining what the form does.
   - `tensile.astro` — Hero, brief positioning ("a modern replacement for the public repeater directory"), `<ComingSoonForm>`.
   - `carbon.astro` — Hero, brief positioning ("browser-based SDR for QSO Forge"), `<ComingSoonForm>`.
   - `about.astro` — Company mission paragraph, principles list (engineering quality, ham community, cross-platform parity), founder bio placeholder.
   - `legal/privacy.astro` — Placeholder copy with a comment block flagging that real text is required before launch.
   - `legal/terms.astro` — Same.
   - `404.astro` — Branded not-found page with link home.

8. **Public assets under `public/`.**
   - `logo.svg` — placeholder lockup (orange rounded square + "QF" monogram + "QSO FORGE" wordmark in a sans typeface). Hand-authored SVG, not a PNG.
   - `favicon.svg` and `favicon.ico`.
   - `og/home.png`, `og/damascus.png`, `og/tensile.png`, `og/carbon.png`, `og/about.png` — 1200x630 OpenGraph images. Hand-crafted PNGs for v1.
   - `screenshots/damascus-tui.png`, `screenshots/damascus-gui.png` — placeholder screenshots; replace with real captures before launch (flagged in Risks).
   - `robots.txt` — allow all, point at `/sitemap-index.xml`.

9. **Deployment.**
   - Create `wrangler.toml` configuring Cloudflare Pages project name `qso-marketing`, build output `dist`, compatibility date current.
   - Create `.github/workflows/deploy.yml` — triggers on push to `main`. Steps: checkout, setup Node 20, `npm ci`, `npm run build`, deploy to Cloudflare Pages using `cloudflare/pages-action@v1` with `apiToken`, `accountId`, `projectName: qso-marketing`, `directory: dist`. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

10. **Repo docs.**
    - Create `README.md` documenting: stack (Astro + Tailwind, Cloudflare Pages, Pages Functions for fulfillment), `npm run dev` / `build` / `preview`, required public env vars (`PUBLIC_BUTTONDOWN_ENDPOINT`, `PUBLIC_CF_ANALYTICS_TOKEN`, `PUBLIC_LS_DAMASCUS_CHECKOUT_URL`, `PUBLIC_DAMASCUS_PRICE_USD`, `PUBLIC_RELEASES_MANIFEST_URL`), pointer to `damascus-fulfillment-pipeline` for the server-side secrets, pointer to the qso-forge release-publishing spec for where the R2 manifest is produced, deployment overview, where design tokens live and how they relate to the Damascus theme file.

## Boundaries

The following are explicitly out of scope for v1 and should not be added during this work:

- Real logo / wordmark design — placeholder SVG lockup only; brand-mark slot is reserved.
- macOS Damascus build — Damascus is not shipping a macOS binary yet; mark macOS as "planned" in the platform matrix.
- Fulfillment plumbing (LS webhook handler, ed25519 bundle signer, Resend email delivery, license recovery worker) — lives in `damascus-fulfillment-pipeline` as Cloudflare Pages Functions deployed alongside this site. This spec covers only the static surfaces: Buy CTAs, `/pricing`, `/thanks`, `/recover-license` form (without its handler).
- The Damascus release-publishing pipeline (CI on `qso-forge` tags → build per-platform binaries → upload to the R2 bucket → publish `latest.json` and `v<version>/...`) — lives in a separate spec in the `qso-forge` repo. This site only *consumes* the resulting manifest; it does not produce binaries.
- Subscription pricing, multi-seat / team licensing, currencies beyond USD — all explicitly out per the fulfillment spec's Boundaries.
- Self-serve customer portal or login — recovery is one rate-limited form; no accounts.
- Blog or changelog beyond linking to GitHub Releases.
- Internationalization (i18n) — English only.
- Real product copy for Tensile and Carbon — teaser pages only with one-line positioning and signup form.
- Newsletter management features beyond a single Buttondown POST endpoint (no list segmentation, no preference center, no double-opt-in customization).
- Real privacy and terms copy — placeholder text is acceptable; legal review and real copy are required before launch (flagged in Risks).
- Custom CMS, headless CMS integration, or any database. The site is fully static; copy lives in `.astro` / `.mdx` files in the repo.
- A11y testing automation in CI beyond the Lighthouse run — manual WCAG checks for v1.

## Risks

- **No real logo or wordmark.** The placeholder lockup is acceptable for build but not for launch. Need a wordmark before `qsoforge.com` goes public. Reserve the brand-mark slot and use a hand-authored SVG so swapping is a one-file change.
- **No real product screenshots for Damascus.** Need real captures of the Slint GUI and ratatui TUI before launch. Placeholder screenshots must not ship live.
- **Legal copy is placeholder.** `/legal/privacy` and `/legal/terms` need real text reviewed by counsel before public launch. Add a visible "DRAFT" banner on those pages until replaced.
- **R2 manifest availability.** If `releases.qsoforge.com/damascus/latest.json` is unreachable at build time (R2 outage, DNS issue, manifest temporarily 404 between publishes), the build falls back to the committed `src/data/release.json` snapshot. As long as someone has run a successful build since the last release, the cached version is current. The snapshot fallback is mandatory, not a nice-to-have.
- **Manifest schema drift.** The manifest is a contract between the qso-forge release pipeline and this site (and future Damascus auto-update). Changes to the field set must be additive; field removals or renames require a coordinated change across both repos. The TypeScript types in `src/lib/release-types.ts` are the canonical schema for the marketing-site side — keep them in sync with the publisher.
- **Cache invalidation on R2.** `latest.json` needs a short cache TTL (≤ 60s) so new releases propagate quickly; versioned files under `/v<version>/` are immutable and should have a long cache TTL (1y). The release-publishing spec in qso-forge owns the cache-control headers; this site simply consumes the URLs.
- **Buttondown endpoint configuration.** The site is useless for capturing emails if `PUBLIC_BUTTONDOWN_ENDPOINT` is unset in the Cloudflare Pages environment. Confirm both production and preview environments have it configured before declaring launch-ready.
- **Color contrast at scale.** Papaya `#FF8000` on `#0A0A0A` passes WCAG AA for large text and graphical objects but is borderline for normal body text. Use papaya only for CTAs, accents, and headings — never for paragraph body text.
- **Cloudflare Pages build minutes.** Free tier allows 500 builds/month, which is generous for this site but worth knowing.
- **Slint theme drift.** If Damascus changes its palette, the marketing tokens go stale. Document the relationship in `README.md` and treat `src/styles/tokens.css` as the synchronization point.
- **Lemon Squeezy as single point of failure.** If LS goes down, no one can buy Damascus. Accepted — running our own checkout is a bigger reliability and compliance risk for a $25 product. Paddle remains a viable migration target if LS terms change. The marketing site itself stays up either way (free Download CTA still works).
- **Founder-pricing anchoring.** The $25 → $50 jump at Damascus 1.0 risks feeling like a bait-and-switch. Mitigation: `/pricing` copy is explicit that $25 is pre-1.0 founder pricing, that founder licenses remain perpetual through all 1.x releases, and that 1.0 buyers pay $50.
- **Checkout URL drift.** `PUBLIC_LS_DAMASCUS_CHECKOUT_URL` is set per environment; a misconfigured preview deploy could send buyers to a dead URL. The Validation section adds a check that the Buy CTA href resolves to a 2xx response in the preview environment before merging.

## Validation

**Local validation:**
- `npm run dev` serves the site on `http://localhost:4321` with no console errors on any page.
- `npm run build` completes successfully with the GitHub API both reachable and unreachable (test the fallback by disabling network).
- `npm run preview` serves the production build identically to local dev.

**Automated checks:**
- Run Lighthouse (mobile, throttled) against the local preview for `/`. All four scores must be ≥ 95.
- Run `npx astro check` for TypeScript and Astro template errors — must be clean.
- Validate generated HTML for accessibility with `axe-core` against the local preview for `/` and `/damascus` — no critical or serious violations.

**Manual verification:**
- Open each page (`/`, `/damascus`, `/tensile`, `/carbon`, `/about`, `/legal/privacy`, `/legal/terms`, a non-existent URL → 404) in Chrome and Firefox. No layout breakage, no console errors.
- Resize viewport from 360px to 1920px on `/` and `/damascus`. No horizontal scroll at any width.
- Toggle `prefers-reduced-motion` (DevTools → Rendering) — verify animations are suppressed.
- Click the Damascus Download CTA on `/` and `/damascus` — confirm it lands on `/damascus/download`. From there, click each platform's link and verify the R2 URL serves the binary with the expected content-type and `content-disposition: attachment`.
- Visit `/damascus/download` from a Linux UA, Windows UA, and macOS UA — verify the "Recommended for your system" highlight follows the UA.
- Spot-check SHA256 displayed on `/damascus/download` against the hash from `shasum -a 256` on a freshly downloaded binary.
- Click the Damascus Buy CTA on `/`, `/damascus`, and `/pricing` — confirm each navigates to the Lemon Squeezy hosted checkout for the configured product. Verify the displayed price matches `PUBLIC_DAMASCUS_PRICE_USD`.
- Submit the recover-license form with a placeholder email — confirm the form posts to `/api/recover-license` and the generic success message renders inline. (Handler response correctness is validated in `damascus-fulfillment-pipeline`.)
- Submit the Tensile and Carbon forms with a valid email — verify the request hits Buttondown and the success message renders inline.
- Submit the forms with an invalid email — verify the error message renders inline.
- Paste each page URL into Slack, Discord, and iMessage — verify the OG image and title unfurl correctly.
- Visually compare a page screenshot side-by-side with a Damascus app screenshot — colors must read as the same brand.

**Deployment validation:**
- Push to a branch, verify the Cloudflare Pages preview build succeeds and a preview URL is generated.
- Merge to `main`, verify production deploy succeeds and `qsoforge.com` resolves.
- Confirm Cloudflare Web Analytics is recording pageviews after first deploy.
