import { useEffect, useRef, useState } from "react";
import type { PosterAction, PosterForm } from "@/features/poster/application/posterReducer";
import { fetchIsochrone } from "@/core/services";
import { getHereApiKey, HERE_KEY_CHANGED_EVENT } from "../infrastructure/hereApiKeyStorage";
import { blendHex } from "@/shared/utils/color";
import type { IsochroneContour } from "../domain/types";

const DEBOUNCE_MS = 600;

function parseRanges(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

/**
 * Generates per-contour hex colors (without '#') that shade from the base
 * color (innermost / shortest time) toward white (outermost / longest time).
 */
function buildContours(ranges: number[], baseColor: string): IsochroneContour[] {
  const n = ranges.length;
  return ranges.map((minutes, i) => {
    const blendFactor = n > 1 ? (i / (n - 1)) * 0.55 : 0;
    const hex = blendHex(baseColor, "#ffffff", blendFactor);
    return { minutes, color: hex };
  });
}

export function useIsochrone(
  dispatch: React.Dispatch<PosterAction>,
  form: PosterForm,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [apiKey, setApiKey] = useState(() => getHereApiKey());

  useEffect(() => {
    function handleKeyChange() {
      setApiKey(getHereApiKey());
    }
    window.addEventListener(HERE_KEY_CHANGED_EVENT, handleKeyChange);
    return () => window.removeEventListener(HERE_KEY_CHANGED_EVENT, handleKeyChange);
  }, []);

  const {
    includeIsochrone,
    latitude,
    longitude,
    isochroneMode,
    isochroneRanges,
    isochroneColor,
    isochroneCustomCenter,
    isochroneCenterLat,
    isochroneCenterLon,
  } = form;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (!includeIsochrone) {
      dispatch({ type: "SET_ISOCHRONE_DATA", geoJson: null });
      return;
    }

    if (!apiKey) {
      dispatch({
        type: "SET_ISOCHRONE_DATA",
        geoJson: null,
        error: "No API key set.",
      });
      return;
    }

    const ranges = parseRanges(isochroneRanges);
    if (ranges.length === 0) return;

    const baseLat = isochroneCustomCenter ? parseFloat(isochroneCenterLat) : parseFloat(latitude);
    const baseLon = isochroneCustomCenter ? parseFloat(isochroneCenterLon) : parseFloat(longitude);

    if (!Number.isFinite(baseLat) || !Number.isFinite(baseLon)) return;

    const contours = buildContours(ranges, isochroneColor || "#0ea5e9");

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: "SET_ISOCHRONE_LOADING", loading: true });

      fetchIsochrone(
        { lat: baseLat, lon: baseLon, mode: isochroneMode, contours },
        apiKey,
        controller.signal,
      )
        .then((geoJson) => {
          dispatch({ type: "SET_ISOCHRONE_DATA", geoJson });
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          console.error("[isochrone] fetch error:", err);
          const message = err instanceof Error ? err.message : "Isochrone fetch failed";
          dispatch({ type: "SET_ISOCHRONE_DATA", geoJson: null, error: message });
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [
    dispatch,
    apiKey,
    includeIsochrone,
    latitude,
    longitude,
    isochroneMode,
    isochroneRanges,
    isochroneColor,
    isochroneCustomCenter,
    isochroneCenterLat,
    isochroneCenterLon,
  ]);
}
