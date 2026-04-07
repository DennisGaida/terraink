export type IsochroneMode = "walking" | "cycling" | "driving";

export interface IsochroneContour {
  minutes: number;
  /** Hex color without '#', assigned per contour for rendering. */
  color: string;
}

export interface IsochroneRequest {
  lat: number;
  lon: number;
  mode: IsochroneMode;
  contours: IsochroneContour[];
}
