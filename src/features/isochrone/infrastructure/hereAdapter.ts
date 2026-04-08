import { decode } from "@here/flexpolyline";
import type { FeatureCollection, Feature, Polygon } from "geojson";
import type { IsochroneRequest, IsochroneMode } from "../domain/types";

const HERE_BASE = "https://isoline.router.hereapi.com/v8/isolines";

const TRANSPORT_MODE: Record<IsochroneMode, string> = {
  walking: "pedestrian",
  cycling: "bicycle",
  driving: "car",
};

interface HerePolygon {
  outer: string;
  inner?: string[];
}

interface HereIsoline {
  range: { type: string; value: number };
  polygons: HerePolygon[];
}

interface HereResponse {
  isolines: HereIsoline[];
}

/**
 * Decode a HERE Flexible Polyline string into a GeoJSON ring ([lon, lat][] ).
 * The decoder returns {lat, lng} tuples — we convert to GeoJSON [lon, lat].
 */
function decodeRing(encoded: string): number[][] {
  const { polyline } = decode(encoded);
  // Close the ring if needed
  const ring = polyline.map(([lat, lng]) => [lng, lat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

function polygonFromHere(p: HerePolygon): Polygon {
  const rings: number[][][] = [decodeRing(p.outer)];
  for (const inner of p.inner ?? []) {
    rings.push(decodeRing(inner));
  }
  return { type: "Polygon", coordinates: rings };
}

export async function fetchIsochrone(
  request: IsochroneRequest,
  apiKey: string,
  signal?: AbortSignal,
): Promise<FeatureCollection> {
  const transportMode = TRANSPORT_MODE[request.mode];
  const sorted = [...request.contours].sort((a, b) => a.minutes - b.minutes);
  const rangeSeconds = sorted.map((c) => c.minutes * 60);

  // Brackets must be percent-encoded so Firefox accepts the URL;
  // HERE decodes %5B/%5D server-side.
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

  // Render largest isochrone first so smaller ones appear on top
  const isolines = [...data.isolines].sort((a, b) => b.range.value - a.range.value);

  const features: Feature[] = isolines.flatMap((isoline) => {
    if (!Array.isArray(isoline.polygons) || isoline.polygons.length === 0) return [];
    const color =
      colorBySeconds.get(isoline.range.value) ??
      request.contours[0]?.color ??
      "#888888";
    return isoline.polygons.map((p) => ({
      type: "Feature" as const,
      geometry: polygonFromHere(p),
      properties: { value: isoline.range.value, fillColor: color, color },
    }));
  });

  return { type: "FeatureCollection", features };
}
