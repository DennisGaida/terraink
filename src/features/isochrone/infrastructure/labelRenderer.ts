import type { FeatureCollection } from "geojson";
import type { MarkerProjectionInput } from "@/features/markers/domain/types";
import { projectMarkerToCanvas } from "@/features/markers/infrastructure/projection";
import { TEXT_DIMENSION_REFERENCE_PX } from "@/features/poster/domain/textLayout";

const LABEL_FONT_BASE_PX = 40;

/**
 * Draws isochrone time labels onto a 2D canvas, positioned at the northernmost
 * point of each polygon ring. Mirrors the IsochroneLabelOverlay HTML overlay.
 */
export function drawIsochroneLabelsOnCanvas(
  ctx: CanvasRenderingContext2D,
  geoJson: FeatureCollection,
  projection: MarkerProjectionInput,
  scaleX: number,
  scaleY: number,
  canvasWidth: number,
  canvasHeight: number,
  strokeOpacity: number,
  fontFamily: string,
): void {
  const dimScale = Math.max(
    0.45,
    Math.min(canvasWidth, canvasHeight) / TEXT_DIMENSION_REFERENCE_PX,
  );
  const fontSize = Math.round(LABEL_FONT_BASE_PX * dimScale);
  const fontStack = fontFamily
    ? `"${fontFamily}", sans-serif`
    : "sans-serif";

  ctx.save();
  ctx.font = `600 ${fontSize}px ${fontStack}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.globalAlpha = strokeOpacity;

  for (const feature of geoJson.features) {
    if (feature.geometry.type !== "Polygon") continue;

    const ring = feature.geometry.coordinates[0];
    let best = ring[0];
    for (const coord of ring) {
      if (coord[1] > best[1]) best = coord;
    }

    const seconds = feature.properties?.value as number;
    const color = feature.properties?.color as string;
    const text = `${Math.round(seconds / 60)} min`;

    const pt = projectMarkerToCanvas(best[1], best[0], projection);
    const x = pt.x * scaleX;
    const y = pt.y * scaleY;

    ctx.fillStyle = color;
    // Subtle shadow so labels are readable over light map areas
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = fontSize * 0.25;
    ctx.fillText(text, x, y - fontSize * 0.2);
  }

  ctx.restore();
}
