export type Platform =
  | "linux-deb"
  | "linux-rpm"
  | "linux-appimage"
  | "linux-arch"
  | "windows-msi"
  | "macos-dmg";

export type Arch = "x86_64" | "aarch64";

export interface ReleaseAsset {
  platform: Platform;
  arch: Arch;
  filename: string;
  url: string;
  size: number;
  sha256: string;
}

export interface ReleaseManifest {
  version: string;
  name: string;
  published_at: string;
  release_notes_url: string | null;
  assets: ReleaseAsset[];
}

const PLATFORMS: readonly Platform[] = [
  "linux-deb",
  "linux-rpm",
  "linux-appimage",
  "linux-arch",
  "windows-msi",
  "macos-dmg",
];

const ARCHES: readonly Arch[] = ["x86_64", "aarch64"];

export function isReleaseManifest(value: unknown): value is ReleaseManifest {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.version !== "string") return false;
  if (typeof obj.name !== "string") return false;
  if (typeof obj.published_at !== "string") return false;
  if (obj.release_notes_url !== null && typeof obj.release_notes_url !== "string") return false;
  if (!Array.isArray(obj.assets)) return false;
  for (const asset of obj.assets) {
    if (!isReleaseAsset(asset)) return false;
  }
  return true;
}

function isReleaseAsset(value: unknown): value is ReleaseAsset {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.platform === "string" &&
    PLATFORMS.includes(a.platform as Platform) &&
    typeof a.arch === "string" &&
    ARCHES.includes(a.arch as Arch) &&
    typeof a.filename === "string" &&
    typeof a.url === "string" &&
    typeof a.size === "number" &&
    typeof a.sha256 === "string"
  );
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  "linux-deb": "Linux (.deb)",
  "linux-rpm": "Linux (.rpm)",
  "linux-appimage": "Linux (AppImage)",
  "linux-arch": "Arch Linux (.pkg.tar.zst)",
  "windows-msi": "Windows (.msi)",
  "macos-dmg": "macOS (.dmg)",
};

const PLATFORM_ORDER: Platform[] = [
  "windows-msi",
  "macos-dmg",
  "linux-deb",
  "linux-rpm",
  "linux-appimage",
  "linux-arch",
];

export function sortAssets(assets: ReleaseAsset[]): ReleaseAsset[] {
  return [...assets].sort(
    (a, b) =>
      PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform),
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}
