import type { PosterForm, PosterState } from "./posterReducer";
import type { MarkerItem, MarkerDefaults } from "@/features/markers/domain/types";

/* ---- param key map ---- */

const FORM_KEYS: Record<keyof PosterForm, string> = {
  location: "loc",
  latitude: "lat",
  longitude: "lng",
  distance: "dist",
  width: "w",
  height: "h",
  theme: "theme",
  layout: "layout",
  displayCity: "city",
  displayCountry: "country",
  displayContinent: "continent",
  fontFamily: "font",
  showPosterText: "text",
  includeCredits: "credits",
  includeBuildings: "bld",
  includeWater: "water",
  includeParks: "parks",
  includeAeroway: "aero",
  includeRail: "rail",
  includeRoads: "roads",
  includeRoadPath: "rpath",
  includeRoadMinorLow: "rminor",
  includeRoadOutline: "routline",
  showMarkers: "mkshow",
};

const REVERSE_FORM_KEYS: Record<string, keyof PosterForm> = Object.fromEntries(
  Object.entries(FORM_KEYS).map(([field, key]) => [key, field as keyof PosterForm]),
);

const BOOL_FIELDS = new Set<keyof PosterForm>([
  "showPosterText",
  "includeCredits",
  "includeBuildings",
  "includeWater",
  "includeParks",
  "includeAeroway",
  "includeRail",
  "includeRoads",
  "includeRoadPath",
  "includeRoadMinorLow",
  "includeRoadOutline",
  "showMarkers",
]);

/* ---- public API ---- */

/** Returns true when the URL contains TerraInk state params. */
export function hasUrlState(): boolean {
  const p = new URLSearchParams(window.location.search);
  return p.has("lat") && p.has("lng");
}

export interface ParsedUrlState {
  form: Partial<PosterForm>;
  customColors: Record<string, string>;
  markers: MarkerItem[];
  markerDefaults: Partial<MarkerDefaults>;
}

/**
 * Parses URL search params into a partial state override.
 * Returns null when no TerraInk params are found.
 */
export function parseUrlState(): ParsedUrlState | null {
  const p = new URLSearchParams(window.location.search);

  if (!p.has("lat") || !p.has("lng")) {
    return null;
  }

  const form: Partial<PosterForm> = {};

  for (const [key, field] of Object.entries(REVERSE_FORM_KEYS)) {
    const raw = p.get(key);
    if (raw === null) continue;

    if (BOOL_FIELDS.has(field)) {
      (form as Record<string, boolean | string>)[field] = raw === "1";
    } else {
      (form as Record<string, string>)[field] = raw;
    }
  }

  let customColors: Record<string, string> = {};
  const ccRaw = p.get("cc");
  if (ccRaw) {
    try {
      const parsed: unknown = JSON.parse(ccRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        customColors = parsed as Record<string, string>;
      }
    } catch {
      // ignore malformed JSON
    }
  }

  let markers: MarkerItem[] = [];
  const mkRaw = p.get("mk");
  if (mkRaw) {
    try {
      const parsed: unknown = JSON.parse(mkRaw);
      if (Array.isArray(parsed)) {
        markers = (parsed as MarkerItem[]).filter(
          (m) =>
            typeof m.id === "string" &&
            typeof m.lat === "number" &&
            typeof m.lon === "number" &&
            typeof m.iconId === "string" &&
            typeof m.size === "number" &&
            typeof m.color === "string",
        );
      }
    } catch {
      // ignore malformed JSON
    }
  }

  const markerDefaults: Partial<MarkerDefaults> = {};
  const mdsizeRaw = p.get("mdsize");
  if (mdsizeRaw !== null) {
    const n = Number(mdsizeRaw);
    if (Number.isFinite(n)) markerDefaults.size = n;
  }
  const mdcolorRaw = p.get("mdcolor");
  if (mdcolorRaw) markerDefaults.color = mdcolorRaw;

  return { form, customColors, markers, markerDefaults };
}

/**
 * Serializes the shareable parts of PosterState to a URL search string.
 */
export function buildUrlSearchString(state: PosterState): string {
  const p = new URLSearchParams();
  const f = state.form;

  for (const [field, key] of Object.entries(FORM_KEYS) as [keyof PosterForm, string][]) {
    const val = f[field];
    if (BOOL_FIELDS.has(field)) {
      p.set(key, (val as boolean) ? "1" : "0");
    } else {
      p.set(key, String(val));
    }
  }

  if (Object.keys(state.customColors).length > 0) {
    p.set("cc", JSON.stringify(state.customColors));
  }

  if (state.markers.length > 0) {
    p.set(
      "mk",
      JSON.stringify(
        state.markers.map(({ id, lat, lon, iconId, size, color }) => ({
          id,
          lat,
          lon,
          iconId,
          size,
          color,
        })),
      ),
    );
  }

  p.set("mdsize", String(state.markerDefaults.size));
  p.set("mdcolor", state.markerDefaults.color);

  return p.toString();
}
