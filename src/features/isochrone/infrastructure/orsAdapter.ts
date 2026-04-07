import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { IsochroneRequest, IsochroneMode } from "../domain/types";

const ORS_BASE = "https://api.openrouteservice.org/v2/isochrones";

const PROFILE: Record<IsochroneMode, string> = {
  walking: "foot-walking",
  cycling: "cycling-regular",
  driving: "driving-car",
};

export async function fetchIsochrone(
  request: IsochroneRequest,
  apiKey: string,
  signal?: AbortSignal,
): Promise<FeatureCollection> {
  const profile = PROFILE[request.mode];
  const rangeSeconds = request.contours.map((c) => c.minutes * 60);

  const res = await fetch(`${ORS_BASE}/${profile}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      locations: [[request.lon, request.lat]],
      range: rangeSeconds,
      range_type: "time",
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Isochrone request failed (${res.status}): ${text}`);
  }

  const geojson = (await res.json()) as FeatureCollection;

  // ORS returns features with a `value` property (seconds).
  // Map each feature back to the matching contour color.
  const colorBySeconds = new Map(
    request.contours.map((c) => [c.minutes * 60, c.color]),
  );

  const features: Feature<Geometry>[] = geojson.features.map((f) => {
    const value = (f.properties?.value as number) ?? 0;
    const color = colorBySeconds.get(value) ?? request.contours[0]?.color ?? "888888";
    return {
      ...f,
      properties: {
        ...f.properties,
        fillColor: color,
        color,
      },
    };
  });

  return { ...geojson, features };
}
