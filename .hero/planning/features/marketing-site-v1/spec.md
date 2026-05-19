---
title: QSO Forge marketing website (v1)
type: feature
status: planning
priority: high
tags: [marketing, brand, astro, greenfield]
created: 2026-05-18
---

# QSO Forge marketing website (v1)

## Context

QSO Forge, LLC is a new amateur-radio software company. The domain `qsoforge.com` is registered and needs a marketing site that introduces the company, positions the first shipping product (Damascus — the ham radio logging app, currently in M1), and reserves stage space for two follow-on products on the roadmap (Tensile — a repeater directory; Carbon — a WebSDR). The product line follows a metallurgy / materials-science naming theme that pairs cleanly with a McLaren-inspired visual identity (papaya orange + green accents on layered near-black surfaces).

This is a greenfield repository: `/home/destes/projects/davydotcom/qso-marketing` currently contains only `.hero/` and `AGENTS.md`. The sibling repo `/home/destes/projects/davydotcom/qso-forge` holds the Damascus source, its README (product copy source-of-truth), and its Slint theme file (`crates/ui/ui/theme.slint`), which is the authoritative color palette this site must match so the marketing surface feels visually continuous with the app.

There is no tracker configured for this repo; the spec is the source of truth. There is no real logo yet — the current placeholder is an orange rounded-square "QF" monogram at `../qso-forge/packaging/icons/qsoforge.png`. A real wordmark is a known gap and is captured in Risks; the site must reserve the brand-mark slot without blocking on it.

## Goal

Ship a static, fast, dark-themed marketing site at `qsoforge.com` that (1) introduces QSO Forge as a serious, engineering-quality-first ham-radio software company, (2) gives Damascus a credible product page with platform support, feature highlights, and a download CTA that routes to the latest GitHub Release, (3) holds teaser pages for Tensile and Carbon with email capture, (4) renders cleanly across 360px–1920px viewports, scores ≥95 on all Lighthouse categories for the home page, and (5) shares design tokens with the Damascus app so the visual identity is consistent across product and marketing surfaces. The site deploys to Cloudflare Pages from a GitHub Actions workflow on push to `main`.

## Kickoff

Marketing site for QSO Forge — home + Damascus product page + Tensile/Carbon coming-soon teasers, Astro static build deployed to Cloudflare Pages.

**Status:** planning — spec just landed, repo is empty except `.hero/` and `AGENTS.md`. No code yet.

**Pick up at:** scaffold the Astro project per `## Changes` step 1–3 (package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json), then drop in the design tokens from `theme.slint` before building any pages.

→ `/home/destes/projects/davydotcom/qso-marketing/.hero/planning/features/marketing-site-v1/spec.md`

**Files:** `/home/destes/projects/davydotcom/qso-marketing/.hero/planning/features/marketing-site-v1/spec.md`, `/home/destes/projects/davydotcom/qso-forge/crates/ui/ui/theme.slint`, `/home/destes/projects/davydotcom/qso-forge/README.md`
**Skip:** Next.js (SSR overkill, runtime cost), commerce/pricing flow (apps aren't sold yet — v2 conversation).

## Approach

**Stack: Astro + Tailwind CSS, deployed to Cloudflare Pages.**

Astro is the right choice here for five concrete reasons: (1) static-first output means no server runtime, no cold starts, and a CDN-only deploy target; (2) component model (`.astro` files) supports the small amount of reuse the site needs (product cards, feature grids, platform badges) without React's runtime cost; (3) MDX support keeps product copy editable as prose rather than JSX; (4) built-in image optimization handles screenshots cleanly; (5) it's TypeScript-native, matching the Rust shop's preference for typed tooling.

Alternatives rejected: **Next.js** is overkill — no SSR is needed, the server runtime adds hosting cost and operational surface, and its image/router complexity is unjustified for ~7 pages. **Eleventy** is lighter but less batteries-included around components, image optimization, and TS — the time saved at scaffolding gets repaid in plumbing. **Plain HTML** can't share a header/footer/product card across pages without templating, which the site genuinely needs.

**Hosting: Cloudflare Pages.** Free tier covers traffic comfortably, global anycast CDN, no cold starts, edge config for redirects, and a clean GitHub integration. Vercel is a viable fallback but adds usage-based billing risk; Cloudflare is the call for v1.

**Information architecture:**
- `/` — Hero with QSO Forge positioning, product grid (Damascus available; Tensile + Carbon "coming soon"), brand statement, footer CTA.
- `/damascus` — Product page: hero, feature grid, platform support matrix, UI screenshot strip, download CTA pointing at the latest GitHub Release, install command snippets, link to GitHub repo.
- `/tensile` — Coming-soon teaser with email signup (Buttondown).
- `/carbon` — Coming-soon teaser with email signup (Buttondown).
- `/about` — Company mission, principles, founder bio placeholder.
- `/legal/privacy` and `/legal/terms` — placeholder copy (flagged in Risks).
- `404.astro`.

**Design tokens:** A single `src/styles/tokens.css` mirrors the Damascus `theme.slint` palette (papaya `#FF8000`, green `#27F08A`, surface layers `#0A0A0A`/`#141414`/`#1C1C1C`, text `#FFFFFF`/`#B8B8B8`, border `#2A2A2A`, status colors, 4px spacing grid, mono font for technical content). Tailwind's theme extends from these tokens so utility classes stay on-brand and future apps can adopt the same file verbatim.

**Latest-release fetch:** Build-time only. `src/lib/releases.ts` calls `https://api.github.com/repos/davydotcom/qso-forge/releases/latest` (unauthenticated; the 60 req/hr limit is fine for CI). The result is written to `src/data/release.json` and consumed by `/damascus` for the version string and release date. If the API call fails, the build falls back to the existing snapshot — builds never break on a flaky API.

**Forms:** `<ComingSoonForm>` posts to a Buttondown endpoint via `fetch`, shows inline success/error messaging, and never causes a full-page reload. The Buttondown URL is read from an environment variable so the same component is reused across `/tensile` and `/carbon`.

**Analytics:** Cloudflare Web Analytics — free, no cookies, no consent banner needed, and a single script tag. Plausible is the alternative if richer dashboards become necessary; that's a swap, not a rewrite.

**SEO + social:** Per-page `<title>`, meta description, OpenGraph + Twitter card meta tags. For v1, ship one hand-crafted `og.png` per page under `public/og/` — simple, no build-time image generation dependency. Sitemap and `robots.txt` are generated via `@astrojs/sitemap`.

## Acceptance Criteria

- THE SYSTEM SHALL render `/`, `/damascus`, `/tensile`, `/carbon`, `/about`, `/legal/privacy`, `/legal/terms`, and a 404 page with no console errors.
- THE SYSTEM SHALL match the Damascus app's color palette (papaya `#FF8000`, green `#27F08A`, layered `#0A0A0A`/`#141414`/`#1C1C1C` surfaces) on every page.
- WHEN a visitor clicks the Damascus download CTA THE SYSTEM SHALL navigate to the GitHub Releases page for the latest tagged release of `davydotcom/qso-forge`.
- WHEN the site is built THE SYSTEM SHALL fetch the latest release metadata from the GitHub API and embed the version string and release date on `/damascus`.
- IF the GitHub API call fails during build THEN THE SYSTEM SHALL fall back to the cached `src/data/release.json` snapshot and complete the build.
- WHEN a visitor submits the Tensile or Carbon "notify me" form THE SYSTEM SHALL POST the email to the configured Buttondown endpoint and display a success message inline without a full-page reload.
- THE SYSTEM SHALL achieve Lighthouse scores ≥ 95 on performance, accessibility, best-practices, and SEO for the home page on a standard mobile-throttled run.
- THE SYSTEM SHALL pass WCAG AA color-contrast checks on body text and CTA buttons against the dark surface.
- THE SYSTEM SHALL render responsively from 360px to 1920px wide without horizontal scroll.
- WHERE the visitor has `prefers-reduced-motion` set THE SYSTEM SHALL suppress non-essential animations.
- THE SYSTEM SHALL include OpenGraph and Twitter card meta tags with a per-page OG image so links unfurl cleanly in Slack, Discord, and iMessage.

## Changes

Execute these in order. Each step names every file or directory to create.

1. **Initialize the Node/Astro project root.**
   - Create `package.json` with `"type": "module"`, scripts `dev`, `build`, `preview`, `astro`, and dependencies: `astro`, `@astrojs/tailwind`, `@astrojs/sitemap`, `@astrojs/mdx`, `tailwindcss`, `typescript`. Pin to current stable majors.
   - Create `.nvmrc` pinning Node 20 LTS.
   - Create `.gitignore` covering `node_modules/`, `dist/`, `.astro/`, `.env`, `.env.*` (except `.env.example`), `.wrangler/`, `.DS_Store`.
   - Create `.env.example` with placeholders for `PUBLIC_BUTTONDOWN_ENDPOINT` and `PUBLIC_CF_ANALYTICS_TOKEN`.

2. **Astro + TypeScript + Tailwind configuration.**
   - Create `astro.config.mjs` — register `@astrojs/tailwind`, `@astrojs/mdx`, `@astrojs/sitemap`, set `site: "https://qsoforge.com"`, set `output: "static"`.
   - Create `tsconfig.json` extending `astro/tsconfigs/strict`.
   - Create `tailwind.config.mjs` extending the theme from the CSS custom properties defined in `src/styles/tokens.css` (colors, spacing scale, font families). Set `darkMode: "class"` and default to dark.

3. **Design tokens shared with the Damascus app.**
   - Create `src/styles/tokens.css` defining `:root` CSS custom properties mirroring `../qso-forge/crates/ui/ui/theme.slint`:
     - Colors: `--color-surface-0` `#0A0A0A`, `--color-surface-1` `#141414`, `--color-surface-2` `#1C1C1C`, `--color-text` `#FFFFFF`, `--color-text-muted` `#B8B8B8`, `--color-accent` `#FF8000`, `--color-accent-2` `#27F08A`, `--color-border` `#2A2A2A`, `--color-success` `#27F08A`, `--color-warning` `#FF8000`, `--color-error` `#FF4444`.
     - Spacing: 4px grid scale.
     - Fonts: sans (system stack) and mono (`ui-monospace, SFMono-Regular, Menlo, monospace`).
   - Create `src/styles/global.css` importing `tokens.css`, setting body background to `--color-surface-0`, text to `--color-text`, base typography, focus-visible outlines, and a `@media (prefers-reduced-motion: reduce)` block that disables transitions and animations.

4. **Layouts.**
   - Create `src/layouts/BaseLayout.astro` — `<html lang="en">`, `<head>` slot for per-page meta, includes global stylesheet, mounts `<SiteHeader>` and `<SiteFooter>`, accepts `title`, `description`, `ogImage`, and `path` props, emits OpenGraph and Twitter card meta tags.

5. **Shared components under `src/components/`.**
   - `SiteHeader.astro` — logo placeholder (`<img src="/logo.svg">`), primary nav (`Damascus`, `Tensile`, `Carbon`, `About`), GitHub icon link to `https://github.com/davydotcom/qso-forge`.
   - `SiteFooter.astro` — copyright line "© QSO Forge, LLC", links to `/legal/privacy`, `/legal/terms`, GitHub.
   - `Hero.astro` — title, subtitle, optional CTA slot. Reused on `/` and product pages.
   - `ProductCard.astro` — props: `name`, `tagline`, `status` (`available` | `coming-soon`), `href`. Used in home product grid.
   - `FeatureGrid.astro` — wraps a responsive grid of `<FeatureCard>` children.
   - `FeatureCard.astro` — props: `title`, `body`, optional `icon` slot.
   - `PlatformBadge.astro` — props: `platform` (`windows` | `linux` | `macos`), `status` (`available` | `planned`). Renders pill with icon.
   - `DownloadButton.astro` — primary papaya CTA. Reads `release.json`, links to the release HTML URL, shows the version string.
   - `ComingSoonForm.astro` — email input + submit button. POSTs to `import.meta.env.PUBLIC_BUTTONDOWN_ENDPOINT` via `fetch`. Inline success/error message. No page reload.
   - `CodeBlock.astro` — mono font, surface-1 background, papaya highlights for command prompts. Used on `/damascus` for install snippets.

6. **Build-time release fetch.**
   - Create `src/lib/releases.ts` — async function `fetchLatestRelease()` that calls `https://api.github.com/repos/davydotcom/qso-forge/releases/latest`, on success writes the trimmed payload (`{ tag_name, name, html_url, published_at }`) to `src/data/release.json`, on failure returns the existing snapshot. Logs which path was taken.
   - Create `src/data/release.json` with a seed snapshot (placeholder version and the canonical releases URL `https://github.com/davydotcom/qso-forge/releases`) so the first build succeeds offline.
   - Wire `fetchLatestRelease()` into a top-level await in `astro.config.mjs` or a prebuild script in `package.json` (`"prebuild": "node ./scripts/fetch-release.mjs"`); create `scripts/fetch-release.mjs` if using the prebuild approach.

7. **Pages under `src/pages/`.**
   - `index.astro` — Hero with company positioning, product grid using `<ProductCard>` for Damascus (available), Tensile (coming soon), Carbon (coming soon), short brand statement, footer CTA.
   - `damascus.astro` — Hero with product tagline, `<FeatureGrid>` covering daily logging, contesting, POTA, multi-station P2P field ops, ADIF I/O, WSJT-X integration, Cabrillo export, map view, DX spots, POTA spots, DUPE detection, multiple logbooks, operator switching, keyboard-driven workflow, first-class TUI. `<PlatformBadge>` row: Windows (MSI), Linux (.deb / .rpm / .AppImage / Arch pkg), macOS (planned). `<DownloadButton>` pulling from `release.json`. `<CodeBlock>` examples for install commands per platform. Link to GitHub repo and release notes.
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
    - Create `README.md` documenting: stack (Astro + Tailwind, Cloudflare Pages), `npm run dev` / `build` / `preview`, required environment variables (`PUBLIC_BUTTONDOWN_ENDPOINT`, `PUBLIC_CF_ANALYTICS_TOKEN`), deployment overview, where design tokens live and how they relate to the Damascus theme file.

## Boundaries

The following are explicitly out of scope for v1 and should not be added during this work:

- Real logo / wordmark design — placeholder SVG lockup only; brand-mark slot is reserved.
- macOS Damascus build — Damascus is not shipping a macOS binary yet; mark macOS as "planned" in the platform matrix.
- Pricing, commerce, license-purchase flow, or any payment integration — apps are proprietary but not currently sold; this is a v2 conversation.
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
- **GitHub API rate limit (60 req/hr unauthenticated).** Mitigated by the snapshot fallback in `src/lib/releases.ts`. If CI starts hitting the limit at higher build cadence, switch to an authenticated `GITHUB_TOKEN` (workflow already has access).
- **Buttondown endpoint configuration.** The site is useless for capturing emails if `PUBLIC_BUTTONDOWN_ENDPOINT` is unset in the Cloudflare Pages environment. Confirm both production and preview environments have it configured before declaring launch-ready.
- **Color contrast at scale.** Papaya `#FF8000` on `#0A0A0A` passes WCAG AA for large text and graphical objects but is borderline for normal body text. Use papaya only for CTAs, accents, and headings — never for paragraph body text.
- **Cloudflare Pages build minutes.** Free tier allows 500 builds/month, which is generous for this site but worth knowing.
- **Slint theme drift.** If Damascus changes its palette, the marketing tokens go stale. Document the relationship in `README.md` and treat `src/styles/tokens.css` as the synchronization point.

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
- Click the Damascus download CTA — confirm it lands on the latest GitHub Release page.
- Submit the Tensile and Carbon forms with a valid email — verify the request hits Buttondown and the success message renders inline.
- Submit the forms with an invalid email — verify the error message renders inline.
- Paste each page URL into Slack, Discord, and iMessage — verify the OG image and title unfurl correctly.
- Visually compare a page screenshot side-by-side with a Damascus app screenshot — colors must read as the same brand.

**Deployment validation:**
- Push to a branch, verify the Cloudflare Pages preview build succeeds and a preview URL is generated.
- Merge to `main`, verify production deploy succeeds and `qsoforge.com` resolves.
- Confirm Cloudflare Web Analytics is recording pageviews after first deploy.
