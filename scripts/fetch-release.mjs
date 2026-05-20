#!/usr/bin/env node
// Prebuild hook: fetch the live release manifest from R2 and snapshot it
// to src/data/release.json so Astro components can `import` it
// synchronously at build time. Falls back to the existing snapshot on
// failure — builds never break on a flaky CDN.

import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SNAPSHOT_PATH = resolve(__dirname, "../src/data/release.json");
const MANIFEST_URL =
  process.env.PUBLIC_RELEASES_MANIFEST_URL ??
  "https://releases.qsoforge.com/damascus/latest.json";
const TIMEOUT_MS = 10_000;

const PLATFORMS = new Set([
  "linux-deb",
  "linux-rpm",
  "linux-appimage",
  "linux-arch",
  "windows-msi",
  "macos-dmg",
]);
const ARCHES = new Set(["x86_64", "aarch64"]);

function isValidManifest(value) {
  if (typeof value !== "object" || value === null) return false;
  if (typeof value.version !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.published_at !== "string") return false;
  if (
    value.release_notes_url !== null &&
    typeof value.release_notes_url !== "string"
  )
    return false;
  if (!Array.isArray(value.assets)) return false;
  return value.assets.every(
    (a) =>
      typeof a === "object" &&
      a !== null &&
      PLATFORMS.has(a.platform) &&
      ARCHES.has(a.arch) &&
      typeof a.filename === "string" &&
      typeof a.url === "string" &&
      typeof a.size === "number" &&
      typeof a.sha256 === "string",
  );
}

async function main() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(MANIFEST_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!isValidManifest(data)) throw new Error("schema validation failed");

    await writeFile(SNAPSHOT_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(
      `[fetch-release] source=manifest-live version=${data.version} assets=${data.assets.length}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[fetch-release] source=snapshot-fallback reason="${message}" url=${MANIFEST_URL}`,
    );
    const raw = await readFile(SNAPSHOT_PATH, "utf8");
    const snapshot = JSON.parse(raw);
    console.log(
      `[fetch-release] snapshot version=${snapshot.version || "(none)"} assets=${snapshot.assets.length}`,
    );
  }
}

main();
