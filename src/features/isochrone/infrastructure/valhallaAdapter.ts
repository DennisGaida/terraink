import type { FeatureCollection } from "geojson";
import type { IsochroneRequest, IsochroneMode } from "../domain/types";

const VALHALLA_URL = "https://valhalla1.openstreetmap.de/isochrone";

const COSTING: Record<IsochroneMode, string> = {
  walking: "pedestrian",
  cycling: "bicycle",
  driving: "auto",
};

export async function fetchIsochrone(
  request: IsochroneRequest,
  signal?: AbortSignal,
): Promise<FeatureCollection> {
  const body = JSON.stringify({
    locations: [{ lon: request.lon, lat: request.lat }],
    costing: COSTING[request.mode],
    contours: request.contours.map((c) => ({
      time: c.minutes,
      color: c.color,
    })),
    polygons: true,
    show_locations: false,
    generalize: 50,
  });

  const res = await fetch(VALHALLA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Isochrone request failed: ${res.status}`);
  }

  return res.json() as Promise<FeatureCollection>;
}
