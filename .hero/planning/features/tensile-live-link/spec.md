---
title: Tensile live-link + brand mark on marketing site
type: feature
status: delivering
priority: medium
tags: [marketing, tensile, brand]
relates-to:
  - marketing-site-v1
created: 2026-05-21
---

# Tensile live-link + brand mark on marketing site

## Context

Tensile M0 (the public VHF/UHF repeater directory) is now live at
`https://tensile.qsoforge.com`. The marketing-site-v1 spec was written when
Tensile was still pre-M0 and treated `/tensile` as a coming-soon teaser with
a Buttondown signup. Now that the product is live and has a real brand mark
(`tensile-mark.svg` in the sibling `qso-forge-tensile` repo), the marketing
site needs to reflect that.

## Goal

Update the marketing site so `/tensile` and the home product grid present
Tensile as a live product, link out to `tensile.qsoforge.com`, surface the
real brand mark, and communicate the M0/M1/M2 roadmap status.

## Approach

- Copy `tensile-mark.svg` from `../qso-forge-tensile/grails-app/assets/images/`
  into this repo's `public/`. Single SVG so swaps are one-file changes.
- Rewrite `src/pages/tensile.astro`:
  - Hero: wordmark variant with the mark + "TENSILE" lockup, "● Live now ·
    tensile.qsoforge.com" eyebrow in the success/green variant, primary CTA
    "Open Tensile" linking to the live URL (external, opens same-tab to
    match existing CTAs).
  - Pitch section (3 `<PitchCard>`s) covering what M0 actually ships:
    map-first search, radio-horizon coverage, open-data lineage.
  - Status section with three `<MilestoneBadge>`s — M0 (Live), M1 (Next),
    M2 (Later).
  - `<CtaBand>` at the bottom repeating the live-site link.
- Update `src/pages/index.astro` Tensile product entry: flip `status` from
  `coming-soon` to `available`, refresh `bullets` to describe M0 (not the
  future-state vision of "QR-to-HT" which is an M1 feature).
- Update `src/components/ProductCard.astro` so the `tensile` `iconKey`
  renders the real triangle mark (re-themed via accent-alt when the card
  is in the "Available now" pill state).

## Acceptance Criteria

- THE SYSTEM SHALL display the Tensile brand mark on both the home product
  card and the `/tensile` hero.
- THE SYSTEM SHALL link the primary `/tensile` CTA to
  `https://tensile.qsoforge.com`.
- THE SYSTEM SHALL show the Tensile product card on the home page with the
  green "Available now" pill, matching Damascus's available styling.
- THE SYSTEM SHALL describe Tensile's status as "Live" for M0, with M1 and
  M2 labelled as roadmap items, not shipped capabilities.
- THE SYSTEM SHALL NOT claim shipped capabilities for M1/M2 features (e.g.
  CHIRP export, QR-to-HT, crowdsourcing).

## Boundaries

- No copy of Tensile's own design tokens or stack into this repo — this
  site only links out. Visual continuity is via the existing QSO Forge
  papaya/green palette.
- No screenshot embed of Tensile on `/tensile` for v1 — link out instead.
- No automatic status polling of `tensile.qsoforge.com` health from this
  static site.
- No update to the marketing-site-v1 spec's "Tensile is coming soon"
  positioning — that spec is frozen; this is an additive change tracked
  separately.

## Risks

- **Bullet drift.** If the home card bullets stay aspirational (mentioning
  M1/M2 features) while the pill says "Available now", visitors will feel
  misled when the live site doesn't include them. Mitigation: bullets are
  scoped strictly to M0 capabilities.
- **Brand-mark divergence.** The `tensile-mark.svg` is copied, not
  symlinked. If Tensile's mark changes upstream, this copy goes stale.
  Acceptable for v1; revisit if the mark iterates frequently.

## Validation

- `npm run build` completes without errors.
- `/tensile` renders the wordmark + mark lockup in the hero, the live-now
  eyebrow in green, and the three roadmap badges.
- Clicking either CTA on `/tensile` opens `https://tensile.qsoforge.com`.
- The home product grid shows Tensile with the green pill and the M0-only
  bullets.
- The home Tensile card icon renders as the triangle mark in green.
