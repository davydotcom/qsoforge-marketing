# qso-marketing

Marketing site for **QSO Forge, LLC** — engineering-quality amateur radio software. Deployed at <https://qsoforge.com>.

## Stack

- **[Astro 6](https://astro.build)** — static-first, content-driven site builder.
- **[Tailwind CSS 4](https://tailwindcss.com)** via PostCSS (`@tailwindcss/postcss`). Theme tokens live in CSS (`src/styles/tokens.css`) using the `@theme {}` directive — there is no `tailwind.config.mjs`.
- **TypeScript** in strict mode.
- **Cloudflare Pages** for static hosting; **Cloudflare Pages Functions** (under `functions/` once added) host the Lemon Squeezy webhook and license-recovery endpoints from the [`damascus-fulfillment-pipeline`](.hero/planning/features/damascus-fulfillment-pipeline/spec.md) spec.

## Local development

Requires Node 22 LTS (`.nvmrc`). Astro 6 dropped Node 20 support.

```sh
npm install
cp .env.example .env       # then fill in real values for local use
npm run dev                # serves http://localhost:4321
npm run build              # static output to ./dist
npm run preview            # serve the built site for a final eyeball check
```

`npm run build` runs `prebuild` first, which calls `scripts/fetch-release.mjs` to fetch the live release manifest from R2 and snapshot it to `src/data/release.json`. If the fetch fails for any reason (R2 down, network blip, manifest 404), the build keeps the existing snapshot and continues — builds never fail on a flaky CDN.

## Public env vars

All variables below are public — they get embedded into the static HTML/JS at build time. Set them in the Cloudflare Pages dashboard (or as GitHub Actions repo variables for CI builds), not as GitHub secrets.

| Variable | Purpose | Default |
|---|---|---|
| `PUBLIC_BUTTONDOWN_ENDPOINT` | POST target for the Tensile / Carbon coming-soon signup forms. | — |
| `PUBLIC_CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics beacon token. | — |
| `PUBLIC_LS_DAMASCUS_CHECKOUT_URL` | Lemon Squeezy hosted checkout URL for the Damascus product. | — |
| `PUBLIC_DAMASCUS_PRICE_USD` | Display price on Buy CTAs and `/pricing`. Bump to `50` at Damascus 1.0. | `25` |
| `PUBLIC_RELEASES_MANIFEST_URL` | R2-hosted release manifest for the Download page. | `https://releases.qsoforge.com/damascus/latest.json` |

Server-side secrets (Lemon Squeezy webhook secret, Resend API key, ed25519 signing key, etc.) are documented in [`damascus-fulfillment-pipeline`](.hero/planning/features/damascus-fulfillment-pipeline/spec.md). They live as Cloudflare Pages secrets, never in the repo.

## Repo layout

```
src/
├── components/        # Astro components (see spec §5)
├── data/release.json  # Snapshot of the R2 release manifest; written by prebuild
├── layouts/           # BaseLayout.astro
├── lib/
│   ├── release-types.ts  # TypeScript mirror of the qso-forge manifest schema
│   └── releases.ts       # Typed accessor for src/data/release.json
├── pages/             # Astro pages — file-based routing
└── styles/
    ├── global.css     # Tailwind import + base layer + reduced-motion
    └── tokens.css     # @theme block — single source of truth, mirrors Damascus
scripts/
└── fetch-release.mjs  # Prebuild hook: pull live manifest from R2
public/                # Static assets served as-is (logo, favicon, robots.txt)
.github/workflows/
└── deploy.yml         # On push to main: build, deploy via wrangler-action
.hero/
├── planning/features/marketing-site-v1/          # This site's spec
├── planning/features/damascus-fulfillment-pipeline/  # LS webhook + signing
└── …                  # Hero workflow files
wrangler.toml          # Cloudflare Pages config
astro.config.mjs
postcss.config.mjs
tsconfig.json
```

## Design tokens — relationship to Damascus

Damascus (the desktop app) defines its color palette in [`crates/ui/ui/theme.slint`](https://github.com/davydotcom/qso-forge/blob/main/crates/ui/ui/theme.slint) in the **private** `qso-forge` repo. This site's `src/styles/tokens.css` mirrors that file value-for-value so the marketing surface and the app feel visually continuous.

**Synchronization point:** if Damascus's palette changes, edit `src/styles/tokens.css` to match. Both files are short; manual sync is the v1 process. Tailwind 4 reads the `@theme {}` block and auto-generates utility classes (`bg-surface-0`, `text-accent`, `text-accent-alt`, etc.) — one source, two surfaces.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`:

1. Checkout, install Node 20 (per `.nvmrc`), `npm ci`.
2. `npm run build` — `prebuild` fetches the R2 manifest, then Astro emits `dist/`.
3. `cloudflare/wrangler-action@v3` runs `wrangler pages deploy dist --project-name=qso-marketing`.

**GitHub Actions secrets required:**
- `CLOUDFLARE_API_TOKEN` — Pages-scoped token, "Edit Cloudflare Pages" permission.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID (visible in the dashboard sidebar).

**GitHub Actions repo variables (non-secret) required:**
- All `PUBLIC_*` vars listed above.

PRs that are pushed to non-`main` branches deploy to a Cloudflare Pages preview URL automatically (via wrangler-action's `--branch` flag).

## Related specs

- [`marketing-site-v1`](.hero/planning/features/marketing-site-v1/spec.md) — this site.
- [`damascus-fulfillment-pipeline`](.hero/planning/features/damascus-fulfillment-pipeline/spec.md) — Lemon Squeezy webhook handler, ed25519 bundle signing, Resend email delivery, license recovery. Ships as Pages Functions in `functions/api/*` alongside this site.
- [`release-publishing-r2`](https://github.com/davydotcom/qso-forge) (lives in `qso-forge`) — produces the R2 manifest this site consumes.

## License

Proprietary. © 2026 QSO Forge, LLC. All rights reserved.
