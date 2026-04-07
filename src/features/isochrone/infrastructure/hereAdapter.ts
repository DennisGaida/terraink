import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon } from "geojson";
import type { IsochroneRequest, IsochroneMode } from "../domain/types";

const HERE_BASE = "https://isoline.router.hereapi.com/v8/isolines";

const TRANSPORT_MODE: Record<IsochroneMode, string> = {
  walking: "pedestrian",
  cycling: "bicycle",
  driving: "car",
};

interface HereArea {
  geometry: Polygon | MultiPolygon;
}

interface HereIsoline {
  range: { type: string; value: number };
  areas: HereArea[];
}

interface HereResponse {
  isolines: HereIsoline[];
}

function mergeAreas(areas: HereArea[]): Polygon | MultiPolygon | null {
  if (areas.length === 0) return null;
  if (areas.length === 1) return areas[0].geometry;

  const coordinates: number[][][][][] = [];
  for (const area of areas) {
    const geom = area.geometry;
    if (geom.type === "Polygon") {
      coordinates.push([geom.coordinates]);
    } else if (geom.type === "MultiPolygon") {
      coordinates.push(...geom.coordinates.map((c) => [c]));
    }
  }
  return {
    type: "MultiPolygon",
    coordinates: coordinates.map((c) => c[0]),
  };
}

export async function fetchIsochrone(
  request: IsochroneRequest,
  apiKey: string,
  signal?: AbortSignal,
): Promise<FeatureCollection> {
  const transportMode = TRANSPORT_MODE[request.mode];
  // Sort ascending so HERE returns values in consistent order
  const sorted = [...request.contours].sort((a, b) => a.minutes - b.minutes);
  const rangeSeconds = sorted.map((c) => c.minutes * 60);

  // Build query string manually. Brackets must be percent-encoded (%5B/%5D)
  // so Firefox accepts the URL; HERE decodes them server-side. Commas in
  // range[values] are left literal — HERE expects them unencoded.
  // encodeURIComponent on origin encodes the comma, which HERE also decodes fine.
  const qs = [
    `transportMode=${encodeURIComponent(transportMode)}`,
    `origin=${request.lat},${request.lon}`,
    `range%5Btype%5D=time`,
    `range%5Bvalues%5D=${rangeSeconds.join(",")}`,
    `apiKey=${encodeURIComponent(apiKey)}`,
  ].join("&");

  const res = await fetch(`${HERE_BASE}?${qs}`, { signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Isochrone request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as HereResponse;

  if (!Array.isArray(data.isolines)) {
    throw new Error(`Unexpected HERE response: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const colorBySeconds = new Map(
    request.contours.map((c) => [c.minutes * 60, c.color]),
  );

  // Reverse so the smallest isochrone (innermost) renders last = on top
  const isolines = [...data.isolines].sort((a, b) => b.range.value - a.range.value);

  const features: Feature<Geometry>[] = isolines
    .map((isoline) => {
      const geometry = mergeAreas(isoline.areas);
      if (!geometry) return null;
      const color =
        colorBySeconds.get(isoline.range.value) ??
        request.contours[0]?.color ??
        "888888";
      return {
        type: "Feature" as const,
        geometry,
        properties: {
          value: isoline.range.value,
          fillColor: color,
          color,
        },
      };
    })
    .filter((f) => f !== null) as Feature<Geometry>[];

  return { type: "FeatureCollection", features };
}
