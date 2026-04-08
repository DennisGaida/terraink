import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { MapInstanceRef } from "@/features/map/domain/types";

interface Props {
  geoJson: FeatureCollection;
  mapRef: MapInstanceRef;
  fontFamily: string;
  strokeOpacity: number;
  overzoomScale: number;
}

export default function IsochroneLabelOverlay({
  geoJson,
  mapRef,
  fontFamily,
  strokeOpacity,
  overzoomScale,
}: Props) {
  const [renderTick, setRenderTick] = useState(0);
  const map = mapRef.current;

  useEffect(() => {
    if (!map) return;
    const sync = () => setRenderTick((t) => t + 1);
    map.on("move", sync);
    map.on("moveend", sync);
    map.on("rotate", sync);
    map.on("resize", sync);
    map.on("load", sync);
    return () => {
      map.off("move", sync);
      map.off("moveend", sync);
      map.off("rotate", sync);
      map.off("resize", sync);
      map.off("load", sync);
    };
  }, [map]);

  const labels = useMemo(() => {
    if (!map) return [];
    return geoJson.features.flatMap((feature) => {
      if (feature.geometry.type !== "Polygon") return [];
      const ring = feature.geometry.coordinates[0];
      let best = ring[0];
      for (const coord of ring) {
        if (coord[1] > best[1]) best = coord;
      }
      const seconds = feature.properties?.value as number;
      const color = feature.properties?.color as string;
      const text = `${Math.round(seconds / 60)} min`;
      try {
        const pt = map.project([best[0], best[1]]);
        return [{ text, color, x: pt.x / overzoomScale, y: pt.y / overzoomScale }];
      } catch {
        return [];
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, geoJson, renderTick, overzoomScale]);

  if (labels.length === 0) return null;

  return (
    <div className="isochrone-label-overlay" aria-hidden="true">
      {labels.map((label, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${label.x}px`,
            top: `${label.y}px`,
            transform: "translate(-50%, -120%)",
            fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : "inherit",
            color: label.color,
            opacity: strokeOpacity,
            fontSize: "0.7rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}
