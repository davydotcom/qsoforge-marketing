# qsoforge-marketing

Marketing site for **QSO Forge, LLC** — high-quality ham radio software for operators who care about both function and design.

## Status

**In design.** A clickable HTML mockup is published for feedback:

→ **Live preview:** https://davydotcom.github.io/qsoforge-marketing/

The implementation spec lives at [`.hero/planning/features/marketing-site-v1/spec.md`](.hero/planning/features/marketing-site-v1/spec.md). Target stack: Astro + Tailwind, deployed to Cloudflare Pages → `qsoforge.com`.

## Products

- **Damascus** — ham radio logging app (available now) · [github.com/davydotcom/qso-forge](https://github.com/davydotcom/qso-forge)
- **Tensile** — modern repeater directory (coming soon)
- **Carbon** — WebSDR (coming soon)

## Repo layout

- `docs/index.html` — published HTML mockup served by GitHub Pages (mirror of `.hero/mocks/marketing-site-v1/`)
- `.hero/` — design specs, knowledge base, and Hero workflow files
- *(future)* `src/`, `astro.config.mjs`, etc. — Astro site, once built per the spec

## Updating the published mock

After editing `.hero/mocks/marketing-site-v1/index.html`, refresh the published copy:

```sh
cp .hero/mocks/marketing-site-v1/index.html docs/index.html
git add docs/index.html
git commit -m "publish: refresh mock"
git push
```

GitHub Pages redeploys automatically on push to `main`.

## License

Proprietary. © 2026 QSO Forge, LLC. All rights reserved.
