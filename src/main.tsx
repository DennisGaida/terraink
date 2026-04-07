import React from "react";
import ReactDOM from "react-dom/client";
import { isNativePlatform, onPlatformAdapterChange } from "@/core/platform";
import maplibregl from "maplibre-gl";
import cspWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker?url";
import App from "./App";
import "./styles/index.css";

// Use the CSP-compatible pre-built worker instead of the inline blob worker.
// Without this, Rollup transforms maplibre-gl's AMD bundle and adds helpers
// (e.g. private-field accessors) to the outer module scope. The embedded
// worker string then references those helpers but can't find them in its own
// execution context, causing "Ne is not defined" when using GeoJSON sources.
maplibregl.setWorkerUrl(cspWorkerUrl);

const syncDisplayMode = () => {
  const isStandalone =
    isNativePlatform() ||
    !!(window as unknown as Record<string, unknown>).Capacitor ||
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari PWA fallback.
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;

  document.documentElement.dataset.displayMode = isStandalone
    ? "standalone"
    : "browser";
};

syncDisplayMode();
onPlatformAdapterChange(syncDisplayMode);
const displayModeQuery = window.matchMedia("(display-mode: standalone)");
if (typeof displayModeQuery.addEventListener === "function") {
  displayModeQuery.addEventListener("change", syncDisplayMode);
} else {
  displayModeQuery.onchange = syncDisplayMode;
}

if ("serviceWorker" in navigator && !isNativePlatform()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
