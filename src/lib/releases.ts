// Build-time release manifest is fetched by scripts/fetch-release.mjs
// (wired as the `prebuild` npm script) and snapshotted to
// src/data/release.json. Astro pages import that JSON synchronously.
// This module only re-exports the snapshot under a typed shape so
// consumers get type safety without re-validating on every import.

import snapshot from "../data/release.json";
import { isReleaseManifest, type ReleaseManifest } from "./release-types.js";

export function getReleaseSnapshot(): ReleaseManifest {
  if (!isReleaseManifest(snapshot)) {
    throw new Error(
      "src/data/release.json failed schema validation — re-run `npm run prebuild` or check the snapshot file.",
    );
  }
  return snapshot;
}
