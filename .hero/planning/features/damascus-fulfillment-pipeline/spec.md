---
title: Damascus paid fulfillment pipeline
type: feature
status: planning
priority: high
tags: [licensing, paid-app, fulfillment, lemon-squeezy, cloudflare-pages-functions, email]
created: 2026-05-19
relates-to:
  - marketing-site-v1
  - qso-forge/license-registration-and-activation
---

# Damascus paid fulfillment pipeline

## Context

QSO Forge sells Damascus as a paid proprietary app. The app already implements offline `qsl1.*` license verification end-to-end (see the completed qso-forge spec `license-registration-and-activation`): a customer pastes a signed bundle into Damascus, the app verifies it against the compiled-in ed25519 public key, encrypts it locally, and stores it. A developer CLI (`tools/sign-license` in the qso-forge repo) mints bundles offline.

What does not yet exist is the **issuer side of that pipeline**: how a customer's payment turns into a `qsl1.*` bundle delivered to their inbox. The qso-forge licensing spec explicitly defers this — its §Boundaries lists "the automation that drives sign-license on every paid order" as out of scope and §12 sketches the customer-fulfillment direction but does not implement it. This spec is that implementation.

The marketing site (`marketing-site-v1`, status: planning) reserves nav space for a Buy CTA and a `/pricing` page but otherwise has no commerce concerns — payment flow is hosted by a third-party processor, signing happens in a Cloudflare Pages Function, and email delivery is via Resend. No customer database, no portal, no login.

**Pricing position:** Damascus is pre-1.0. The current price is **$25 (founder)**. When 1.0 ships, the price rises to **$50 (personal)**. The bundle's `tier` field (`founder` / `personal`) distinguishes the two cohorts for records and future communication; the app itself does not branch on tier in v1.

## Goal

A customer who clicks **Buy Damascus** on `qsoforge.com` pays $25 (or $50 post-1.0) via a hosted Lemon Squeezy checkout, and within 30 seconds (Phase 2) or up to 24 hours (Phase 1) receives a transactional email containing their `qsl1.*` license bundle plus paste-in instructions. If they lose the email, a single-form `/recover-license` page re-delivers it. No login, no portal, no customer DB.

The signing key for the ed25519 bundle issuer lives in a Cloudflare Pages secret in Phase 2 (deliberately relaxed from the qso-forge spec's "non-internet-facing signing machine" stance, with mitigations called out below). In Phase 1, signing happens on the operator's laptop using the existing `sign-license` CLI.

## Kickoff

Two-phase delivery for Damascus paid licensing — **Phase 1 manual** (LS webhook posts to Discord, operator runs `sign-license` and emails the bundle, 24h SLO) to launch and de-risk the email template; **Phase 2 automated** (Cloudflare Pages Function verifies LS webhook HMAC, signs with `@noble/ed25519` ported from the Rust signer, dispatches via Resend) once Phase 1 is working on real orders.

**Status:** planning — depends on `marketing-site-v1` Astro scaffold landing first; that spec is also amended to add the Buy CTA and `/pricing` page.

**Pick up at:** Lemon Squeezy product setup (one product, $25 founder, US-only currency, license-key feature disabled), then the Phase 1 webhook stub + manual runbook. Phase 2 is a follow-on once Phase 1 has handled ≥ 5 real orders.

→ `/home/destes/projects/davydotcom/qso-marketing/.hero/planning/features/damascus-fulfillment-pipeline/spec.md`

**Files:** `functions/api/lemonsqueezy-webhook.ts`, `functions/api/recover-license.ts`, `functions/_lib/sign-bundle.ts`, `functions/_lib/email.ts`, `functions/_templates/license-email.{txt,html}`, `src/pages/pricing.astro`, `src/pages/thanks.astro`, `src/pages/recover-license.astro`, `docs/runbooks/manual-license-fulfillment.md`.

**Skip:** Self-serve customer portal, multi-seat / team licensing, subscription pricing, currencies beyond USD in v1, self-hosted email, revocation (no CRL in Damascus v1), pricing-tier feature gating.

## Approach

### Storefront: Lemon Squeezy

**Decision: Lemon Squeezy hosted checkout as merchant of record.**

Concrete reasons:
- **MoR handles tax.** EU VAT, UK VAT, AU GST, US state nexus, K-1s — all on LS. Hams are global; we don't want to file VAT MOSS for $25 transactions.
- **HMAC-signed webhooks** (`X-Signature` header, SHA-256). Clean integration point for the worker.
- **One-time purchase product mode** maps directly onto Damascus's perpetual-license model.
- **~5% + 50¢ fee.** On $25 that's $1.75 (93% takeaway); on $50 that's $3.00 (94% takeaway). Acceptable.
- **Custom thank-you redirect** so the post-checkout experience stays on-brand.

**Alternatives considered:**

| Option | Why not |
|---|---|
| Stripe direct | You become merchant of record — EU VAT MOSS, US sales tax nexus, every-jurisdiction compliance burden. Cheaper fees, real ops burden. |
| Paddle | Equivalent to LS feature-wise. Larger company, less indie-friendly UX, similar fees. Viable fallback. |
| Polar.sh | Newer/cheaper, MoR. Less proven for paid-binary use case; revisit at higher volume. |
| Gumroad | 10% fee, less professional feel for an engineering tool. |
| LS built-in license keys | LS issues opaque alphanumeric keys. **Doesn't fit** — Damascus only accepts `qsl1.*` ed25519-signed bundles. We use LS's order webhook only; the license-key feature stays off. |

**LS product configuration:**
- One product: "Damascus License".
- One variant: $25 USD (founder pricing). Raise to $50 in the LS dashboard at 1.0; no code change.
- Thank-you redirect: `https://qsoforge.com/thanks?order={order_number}`.
- Webhook target: `https://qsoforge.com/api/lemonsqueezy-webhook`.
- Webhook events subscribed: `order_created` only.
- Webhook signing secret saved as the `LS_WEBHOOK_SECRET` Cloudflare Pages env var.

### Hosting: Cloudflare Pages Functions

The marketing site already deploys to Cloudflare Pages. Pages Functions (the Pages-flavored Workers binding) run in the same project, share env vars, and deploy with the site. Folding fulfillment endpoints into `functions/api/*` keeps the deploy story simple — one repo, one CI job, one set of secrets.

If fulfillment grows beyond what fits comfortably in Pages Functions (e.g., a real customer DB, multi-product fulfillment), split it out then. Premature split for two endpoints is overhead.

### Phase 1: Manual fulfillment (launch — first ~5–20 orders)

The whole pipeline does NOT need to be automated to take payment. The first real customers can be served by hand. This validates LS configuration, the email template, the bundle paste flow, and the operator's mental model before any signing code runs in a Worker.

**Phase 1 flow:**
1. Customer pays on LS.
2. LS `order_created` webhook hits `functions/api/lemonsqueezy-webhook.ts`.
3. Worker verifies HMAC, parses `{email, order_number, product_id, total}`, posts a structured Discord message to a webhook URL (`DISCORD_FULFILLMENT_WEBHOOK` env var). Returns 200.
4. Operator sees the Discord ping, opens a terminal on their laptop, runs:
   ```
   sign-license sign --customer-id $(uuidv5 namespace order_number) \
                     --tier founder --expires never \
                     --passphrase-stdin
   ```
5. Operator sends a transactional email to the customer using a saved Postmark/Resend template, pasting the bundle into the body.

**Customer-facing SLO:** "Your license bundle will arrive within 24 hours" displayed on the thank-you page. In practice the operator delivers within minutes during waking hours.

The Phase 1 webhook stub is a real piece of code that survives into Phase 2 — same HMAC verification, same env var, just a different action after the parse step.

### Phase 2: Automated fulfillment (Cloudflare Pages Function)

Once Phase 1 has handled ≥ 5 real orders cleanly and the email template is dialed in, swap the Discord-notify action for inline signing + Resend.

```
LS order_created webhook
  │   X-Signature: HMAC-SHA256(payload, LS_WEBHOOK_SECRET)
  ▼
functions/api/lemonsqueezy-webhook.ts
  │  1. verify HMAC (constant-time compare)
  │  2. parse order: { email, order_number, product_id, total }
  │  3. derive license_id = uuidv5(NAMESPACE, order_number)         // idempotent
  │  4. derive customer_id = sha256(email).hex[..32]                // opaque
  │  5. build canonical payload JSON (sorted keys, RFC3339)
  │  6. sign with ed25519 private key (DAMASCUS_SIGNING_PRIVATE_KEY)
  │  7. emit qsl1.<base64url(payload)>.<base64url(sig)>
  ▼
functions/_lib/email.ts → Resend API
  │  template: license-email.{txt,html}
  │  fields: { customer_email, bundle, paste_instructions_url }
  ▼
Customer inbox
```

**Idempotency by construction.** `license_id` is `uuidv5(NAMESPACE, order_number)` — same order always produces the same UUID. The full payload is deterministic from order data + signing key, so the emitted bundle is byte-for-byte identical across replays. This means:
- LS webhook retries on transient 5xx (network blip, Worker cold start) deliver the same bundle.
- `/recover-license` regenerates the bundle without us storing anything.
- No customer DB needed for v1.

**Signing library: `@noble/ed25519`.** Pure TypeScript, audited, ~5KB, runs in Workers without WASM. Bundle canonicalization (sorted keys, no whitespace, RFC3339 timestamps) ports directly from the Rust `sign-license` implementation. A CI test verifies byte-for-byte parity against a fixed Rust-generated test vector (`fixtures/test-vector.qsl1`) — if the JS canonicalizer ever drifts from Rust, that test fails immediately.

**Resend** for transactional email. Reasons: cheap (≤ 3000 emails/mo free), indie-friendly API, good deliverability on a fresh domain when SPF/DKIM/DMARC are configured. Postmark is a near-equivalent fallback.

### License recovery: `/recover-license`

Single-input form: customer enters their email, submits. Handler:

1. POST to `functions/api/recover-license.ts`.
2. Worker rate-limits: 1 request per email per hour, via Cloudflare KV (`RECOVERY_RATELIMIT` binding).
3. Worker calls LS Orders API filtered by `user_email` + `product_id`, status `paid`.
4. For each matching order, regenerate the bundle (same deterministic flow as the webhook), email via Resend.
5. Return 200 with a generic "If we have a record of that email, we've sent your license" message — does not disclose whether the email matched (anti-enumeration).

No login. No customer DB lookup. The LS Orders API + deterministic signing means we don't need to store anything ourselves.

### Signing-key custody

The ed25519 private key lives as a Cloudflare Pages secret (`DAMASCUS_SIGNING_PRIVATE_KEY`, base64-encoded 32 bytes). This deliberately relaxes the qso-forge licensing spec §12 stance ("signing happens on a non-internet-facing machine"). The tradeoff: instant delivery (Phase 2) vs an offline air gap. Mitigations:

- **Cloudflare account 2FA** required on the operator account.
- **Restricted dashboard access** — only the operator can read/rotate the secret.
- **Key rotation playbook** documented (mint a `qsl2` keypair offline, ship the new public key in the next Damascus release, sign new bundles with the new key, retire the old key). The qso-forge spec already supports `qsl2` prefix rotation.
- **Compromise response:** if the CF account is breached, the immediate action is mint `qsl2`, ship a Damascus release that trusts only `qsl2`, re-issue active customer bundles in `qsl2`. The qso-forge spec's "two-slot pubkey" mechanism is designed for exactly this.

If at any point this tradeoff feels wrong, fall back to Phase 1's manual signing — the Phase 2 worker can be reverted to the Phase 1 stub in one PR.

### Marketing site additions (cross-reference to marketing-site-v1)

The marketing-site-v1 spec is amended in this same change to add:
- `/pricing` page (Damascus card with $25 founder price, Buy CTA → LS checkout URL; Tensile and Carbon "coming soon" cards).
- `/thanks` page (post-checkout: "Your license bundle is on its way to {email_hint}. If you don't see it within 24 hours, check spam or use [recover license]").
- `/recover-license` page (single-input form, posts to the worker).
- Buy CTAs on `/` and `/damascus` alongside the existing Download CTA. Download stays free (Damascus auto-enters 30-day Evaluation on first launch).
- `BuyButton.astro` and `PricingCard.astro` components.

Those changes ship with the Phase 1 launch.

## Acceptance Criteria

- WHEN a customer completes checkout on Lemon Squeezy, THE SYSTEM SHALL receive an `order_created` webhook at `functions/api/lemonsqueezy-webhook.ts` within 30 seconds.
- IF the webhook `X-Signature` HMAC does not match `LS_WEBHOOK_SECRET`, THEN THE SYSTEM SHALL respond with HTTP 401 and perform no further action.
- WHEN a valid `order_created` webhook arrives in Phase 1, THE SYSTEM SHALL post a structured message to the Discord fulfillment webhook containing `order_number`, `email`, `product_id`, and `total`, and return HTTP 200.
- WHEN a valid `order_created` webhook arrives in Phase 2, THE SYSTEM SHALL mint a `qsl1.*` bundle with deterministic `license_id = uuidv5(NAMESPACE, order_number)` and dispatch a delivery email via Resend within 30 seconds.
- WHEN the same `order_number` is processed twice (LS retry, manual replay), THE SYSTEM SHALL produce a byte-identical `qsl1.*` bundle (idempotency).
- WHEN a customer submits their email to `/recover-license`, IF LS has at least one paid Damascus order for that address, THEN THE SYSTEM SHALL re-mint and re-email the bundle (deterministic regeneration, no storage lookup).
- WHEN a `/recover-license` request arrives, THE SYSTEM SHALL rate-limit to 1 request per email per hour via Cloudflare KV; excess requests return 429.
- THE SYSTEM SHALL return a generic "if we have a record we've sent it" response from `/recover-license` regardless of whether the email matched, to avoid enumeration disclosure.
- THE SYSTEM SHALL store the ed25519 private signing key only as the `DAMASCUS_SIGNING_PRIVATE_KEY` Cloudflare Pages secret. No plaintext key in source, in CI logs, or in any committed file.
- THE SYSTEM SHALL persist no customer PII beyond what Lemon Squeezy already stores in the order record. No local customer DB, no KV/D1 row keyed on email.
- THE SYSTEM SHALL set `tier: "founder"` on bundles minted before Damascus 1.0 release, and `tier: "personal"` thereafter. The cutover is a one-line code change at 1.0; no app-side gating.
- THE SYSTEM SHALL set `expires_at: null` on all v1 bundles (perpetual licenses).
- THE SYSTEM SHALL emit `customer_id = sha256(lowercased email).hex[..32]` so the bundle contains no plaintext email (qso-forge spec §1 requires `customer_id` to never be an email).
- WHEN the JS bundle signer runs against the canonical test vector at `fixtures/test-vector.qsl1`, THE SYSTEM SHALL produce a bundle byte-identical to the Rust-signed reference; CI must enforce.

## Changes

Execute in order. Phases 1 and 2 are sequential — do not start Phase 2 until Phase 1 has handled real orders.

### Phase 1 — manual launch

1. **Lemon Squeezy account + product.**
   - Create LS account; complete tax + payout setup.
   - Create "Damascus License" product, single variant `$25 USD`, perpetual.
   - Disable LS license-key feature on the product (we do not use LS's keys).
   - Set thank-you redirect: `https://qsoforge.com/thanks?order={order_number}`.
   - Create webhook subscription: `https://qsoforge.com/api/lemonsqueezy-webhook`, event `order_created`, save the signing secret.

2. **Cloudflare Pages env vars** (Pages dashboard → Settings → Environment variables).
   - `LS_WEBHOOK_SECRET` — from LS webhook config above.
   - `DISCORD_FULFILLMENT_WEBHOOK` — Discord webhook URL for the operator's fulfillment channel.

3. **Phase 1 webhook stub.**
   - Create `functions/api/lemonsqueezy-webhook.ts`. Verify HMAC (constant-time compare, `crypto.subtle.timingSafeEqual` via Web Crypto). On valid signature, POST structured payload to `DISCORD_FULFILLMENT_WEBHOOK`. Return 200. On invalid signature, return 401 with no body.
   - Add a unit test for the HMAC verifier against an LS-provided sample payload.

4. **Marketing site additions** (amends marketing-site-v1).
   - `src/pages/pricing.astro` — Damascus card with $25 founder price + Buy button linking to the LS checkout URL; Tensile and Carbon "coming soon" cards.
   - `src/pages/thanks.astro` — Order confirmation: "Your license bundle is on its way. Watch for an email from `licenses@qsoforge.com` within 24 hours. Lost it? [recover-license link]."
   - `src/pages/recover-license.astro` — Single-input form (`email`), POSTs to `/api/recover-license` (404s until Phase 2; show "coming soon" copy or proxy to mailto: for now).
   - `src/components/BuyButton.astro` — papaya CTA, props `href`, `price`, `tier-label`. Used on `/`, `/damascus`, `/pricing`.
   - `src/components/PricingCard.astro` — product name, price, feature list slot, primary CTA slot.
   - Wire BuyButton into `/` (next to existing Download CTA) and `/damascus` (next to DownloadButton).

5. **Manual fulfillment runbook.**
   - Create `docs/runbooks/manual-license-fulfillment.md` covering:
     - Discord notification format.
     - Exact `sign-license sign` command with `--customer-id` derivation (`uuidv5` from `order_number` — same as Phase 2, so manually-signed bundles are reproducible by the Phase 2 worker for recovery).
     - Email template (subject, body, paste instructions, screenshot of Damascus activation modal).
     - 24h SLO + Discord follow-up workflow.

### Phase 2 — automated fulfillment

6. **Port signer to TypeScript.**
   - Create `functions/_lib/sign-bundle.ts` using `@noble/ed25519`. Implement:
     - `canonicalize(payload: object): string` — sorted-key, no-whitespace JSON serialization, RFC3339 timestamps.
     - `signBundle(payload: object, privateKey: Uint8Array): string` — returns `qsl1.<b64url-payload>.<b64url-sig>`.
   - Create `fixtures/test-vector.qsl1` — a Rust-signed reference bundle generated from a fixed payload + test keypair.
   - Add `tests/sign-bundle.spec.ts` (vitest) — verifies JS output matches the fixture byte-for-byte.

7. **Add remaining secrets to Cloudflare Pages.**
   - `DAMASCUS_SIGNING_PRIVATE_KEY` — base64 of the 32-byte ed25519 private key. (Generated offline; mint with `sign-license keygen`.)
   - `LS_API_KEY` — LS API key for orders lookup (used by `/recover-license`).
   - `RESEND_API_KEY` — Resend transactional API key.
   - `DAMASCUS_PRODUCT_ID` — LS variant id for the recovery query filter.
   - `LICENSE_ID_NAMESPACE` — fixed UUIDv4 used as the `uuidv5` namespace for deterministic license ids. Generate once, never change.

8. **Resend integration.**
   - Add SPF, DKIM, DMARC records for `qsoforge.com` per Resend's domain setup.
   - Create `functions/_lib/email.ts` — wraps Resend SDK with a `sendLicense({to, bundle, orderNumber})` function.
   - Create `functions/_templates/license-email.txt` and `license-email.html` — subject "Your Damascus license", body with bundle in a `<pre>` block and paste instructions linking to Damascus's activation docs.

9. **Replace Phase 1 stub.**
   - Update `functions/api/lemonsqueezy-webhook.ts`: after HMAC verification, derive ids, sign bundle, call `sendLicense`. Keep the Discord notification as a parallel info-channel (operator wants visibility on every order regardless).

10. **Recovery endpoint.**
    - Create `functions/api/recover-license.ts`.
    - Bind Cloudflare KV namespace `RECOVERY_RATELIMIT` to the project; wrangler binding name `RATELIMIT_KV`.
    - On POST: rate-limit (key `recover:<sha256(email)>`, TTL 3600s, value any), call LS Orders API filtered by `user_email` + `DAMASCUS_PRODUCT_ID` + status `paid`, for each match regenerate + email.
    - Always return 200 with `{ ok: true }` for valid POSTs; 429 if rate-limited; 400 if email malformed.

11. **CI parity check.**
    - GitHub Actions step that runs `npm test` — must include the JS↔Rust signer fixture test. Block merges on failure.

12. **1.0 cutover (future, documented).**
    - When Damascus 1.0 ships: change LS variant price to $50, change `tier` in the signer from `"founder"` to `"personal"`. One-line code change in `functions/_lib/sign-bundle.ts` (or read from an env var so it's a config flip with no deploy).

## Boundaries

Explicitly out of scope for this spec:

- **Self-serve customer portal / login.** Recovery is one form with rate-limiting. No accounts.
- **Multi-seat / team licensing.** Single-seat-but-unbound (the de facto multi-machine policy is baked into the qso-forge spec — paste on as many machines as you own).
- **Subscription pricing.** Damascus is perpetual. The bundle format supports `expires_at` for future subscriptions but v1 always emits `null`.
- **Currencies beyond USD.** LS shows local-currency conversion at checkout; the product is priced in USD.
- **License revocation.** Damascus v1 has no CRL (qso-forge spec §12 calls it out as v2 work). Refunds happen in LS dashboard; we don't revoke the bundle.
- **Refund automation.** Manual via LS dashboard.
- **Discount codes.** LS supports them; not used in v1.
- **Upgrade pricing for founder buyers at 1.0.** Pure pricing decision, no code change — founder licenses remain perpetual and valid; the price change at 1.0 only affects new buyers.
- **Email infrastructure self-hosted.** Resend (or equivalent SaaS) handles transactional email.
- **Affiliate / reseller channels.**
- **Per-feature gating** (the bundle's `features` map is reserved per qso-forge spec; not exercised here).

## Risks

- **Signing key custody (Phase 2).** The ed25519 private key lives in a Cloudflare Pages secret, not on an air-gapped machine. This deviates from qso-forge spec §12. **Mitigations:** 2FA on the CF account, restricted dashboard access, documented key-rotation playbook using the spec's built-in `qsl2` prefix bump. **Fallback:** revert to Phase 1 manual signing — the worker can be reduced to the Phase 1 stub in one PR.
- **Idempotency requires deterministic ids.** The whole "no customer DB" property hinges on `license_id = uuidv5(NAMESPACE, order_number)`. If `LICENSE_ID_NAMESPACE` is ever rotated or lost, recovery for old orders breaks. **Mitigation:** treat the namespace as a sealed secret, document it in 1Password, never rotate.
- **JS ↔ Rust signer drift.** If `@noble/ed25519` canonicalization diverges from the Rust signer, bundles minted in the worker won't verify against Damascus's compiled-in public key. **Mitigation:** CI fixture test (Changes step 6). Failure is loud and immediate.
- **Resend deliverability.** Transactional email landing in spam means customers think their purchase failed. **Mitigations:** SPF + DKIM + DMARC on `qsoforge.com`; "from" address `licenses@qsoforge.com`; thank-you page explicitly mentions checking spam and links to `/recover-license`.
- **Lemon Squeezy dependency.** If LS goes down, no one can buy. Single point of failure for revenue. **Accepted** — running our own checkout is a bigger reliability + compliance risk for a $25 product. Paddle remains a viable migration target if LS terms change.
- **Founder-pricing anchoring.** $25 → $50 at 1.0 might feel like a bait-and-switch to founder buyers. **Mitigation:** marketing copy is explicit that $25 is founder/pre-1.0 pricing, perpetual license, valid through 1.x; communicate the 1.0 price change with at least 30 days notice via the email list.
- **Enumeration via /recover-license.** A naive implementation discloses which emails are paid customers (response varies with hit/miss). **Mitigation:** always return generic 200; rate-limit by email; the customer-id hash never echoes back.
- **Webhook replay attacks.** LS HMAC verification prevents forgery; idempotent license_id generation makes replays harmless (same bundle emitted, no state change). **Accepted.**
- **Cloudflare Pages Functions cold starts.** First webhook of the day may take ~500ms; LS retries on timeout. **Accepted** — well within LS's tolerance.

## Validation

**Phase 1:**
- LS provides a webhook simulator in the dashboard. Send a sample `order_created` payload with valid HMAC → verify Discord notification arrives with the expected fields.
- Send the same payload with a tampered signature → verify 401 response, no Discord notification.
- Send a payload with the wrong event type → verify the handler returns 200 but no Discord notification (we only act on `order_created`).
- Make a real test-mode purchase on LS, end-to-end. Operator follows the runbook to sign + email. Customer (you, with a test email) pastes the bundle into Damascus. Verify activation succeeds, status bar shows `Active`, settings card shows the founder tier.

**Phase 2:**
- Run `tests/sign-bundle.spec.ts` — JS output must match the Rust-signed `fixtures/test-vector.qsl1` byte-for-byte.
- Make a real test-mode purchase. Verify email arrives within 30s of the LS webhook firing.
- Paste the emailed bundle into Damascus — verify activation succeeds.
- Replay the same LS webhook (LS dashboard offers this). Verify the second email contains a bundle byte-identical to the first.
- Submit `/recover-license` form with the same email. Verify re-email arrives with the same bundle.
- Submit `/recover-license` form with an unknown email. Verify 200 response with the generic message; no email sent.
- Submit `/recover-license` form twice within 1h for the same email. Verify second request returns 429.
- Verify Resend delivery in Gmail, Outlook, FastMail, and Proton — check inbox placement and that the `<pre>`-wrapped bundle copy-pastes cleanly (no smart-quote or line-wrap corruption).

**Production launch checklist:**
- Operator makes one real purchase end-to-end with a fresh email. Bundle arrives, pastes, activates.
- Verify Cloudflare Pages secrets are set in production (not just preview) — the `wrangler pages secret list` output should include all five Phase 2 secrets.
- Verify LS webhook target points at production, not preview.
- Confirm DMARC report shows `qsoforge.com` aligned for at least 7 days before driving traffic to /pricing.
