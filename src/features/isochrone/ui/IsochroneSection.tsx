import { useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { ORS_API_KEY } from "@/core/config";
import type { IsochroneMode } from "../domain/types";

const TRANSPORT_MODES: { value: IsochroneMode; label: string }[] = [
  { value: "walking", label: "Walk" },
  { value: "cycling", label: "Bike" },
  { value: "driving", label: "Drive" },
];

const PRESET_RANGES: number[] = [5, 10, 15, 20, 30, 45, 60];
const PRESET_COLORS = [
  "#0ea5e9", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#8b5cf6",
];

export default function IsochroneSection() {
  const { state, dispatch } = usePosterContext();
  const { form, isochroneLoading, isochroneError } = state;

  const [rangeInput, setRangeInput] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const hasApiKey = Boolean(ORS_API_KEY);

  function setField(name: string, value: string | boolean) {
    dispatch({ type: "SET_FIELD", name, value });
  }

  function parseRanges(raw: string): number[] {
    return raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
  }

  const ranges = parseRanges(form.isochroneRanges);

  function addRange(minutes: number) {
    if (ranges.includes(minutes)) return;
    const next = [...ranges, minutes].sort((a, b) => a - b);
    setField("isochroneRanges", next.join(","));
  }

  function removeRange(minutes: number) {
    const next = ranges.filter((r) => r !== minutes);
    setField("isochroneRanges", next.join(","));
  }

  function handleRangeInputAdd() {
    const val = parseInt(rangeInput, 10);
    if (Number.isFinite(val) && val > 0 && val <= 120) {
      addRange(val);
      setRangeInput("");
    }
  }

  function handleUseMapCenter() {
    setField("isochroneCenterLat", form.latitude);
    setField("isochroneCenterLon", form.longitude);
  }

  return (
    <section className="panel-block isochrone-section">
      <div className="toggle-field">
        <span className="section-summary-label" style={{ marginBottom: 0 }}>ISOCHRONE</span>
        <label className="theme-switch">
          <input
            type="checkbox"
            name="includeIsochrone"
            checked={form.includeIsochrone}
            onChange={(e) => setField("includeIsochrone", e.target.checked)}
          />
          <span className="theme-switch-track" aria-hidden="true" />
        </label>
      </div>

      {form.includeIsochrone && (
        <div className="isochrone-controls">
          {/* Transport mode */}
          <div className="isochrone-field">
            <span className="isochrone-label">Transport</span>
            <div className="isochrone-mode-group">
              {TRANSPORT_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`isochrone-mode-btn${form.isochroneMode === value ? " is-active" : ""}`}
                  onClick={() => setField("isochroneMode", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time ranges */}
          <div className="isochrone-field">
            <span className="isochrone-label">Ranges (min)</span>
            <div className="isochrone-ranges">
              {ranges.map((r) => (
                <span key={r} className="isochrone-chip">
                  {r}
                  <button
                    type="button"
                    className="isochrone-chip-remove"
                    onClick={() => removeRange(r)}
                    aria-label={`Remove ${r} minutes`}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <div className="isochrone-range-add">
                <input
                  type="number"
                  className="isochrone-range-input"
                  value={rangeInput}
                  min={1}
                  max={120}
                  placeholder="min"
                  onChange={(e) => setRangeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRangeInputAdd()}
                />
                <button
                  type="button"
                  className="isochrone-range-add-btn"
                  onClick={handleRangeInputAdd}
                  title="Add time range"
                >
                  +
                </button>
              </div>
            </div>
            <div className="isochrone-presets">
              {PRESET_RANGES.filter((r) => !ranges.includes(r)).map((r) => (
                <button
                  key={r}
                  type="button"
                  className="isochrone-preset-btn"
                  onClick={() => addRange(r)}
                >
                  +{r}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="isochrone-field isochrone-color-field">
            <span className="isochrone-label">Color</span>
            <div className="isochrone-color-row">
              <button
                type="button"
                className="isochrone-color-swatch"
                style={{ backgroundColor: form.isochroneColor }}
                onClick={() => setShowColorPicker((v) => !v)}
                title="Pick isochrone color"
                aria-pressed={showColorPicker}
              />
              {showColorPicker && (
                <div className="isochrone-color-presets">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`isochrone-color-preset${form.isochroneColor === c ? " is-active" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        setField("isochroneColor", c);
                        setShowColorPicker(false);
                      }}
                      aria-label={c}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Opacity / width sliders */}
          <div className="isochrone-field">
            <span className="isochrone-label">Fill opacity</span>
            <div className="isochrone-slider-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.isochroneFillOpacity}
                onChange={(e) => setField("isochroneFillOpacity", e.target.value)}
              />
              <span className="isochrone-slider-value">
                {Math.round(Number(form.isochroneFillOpacity) * 100)}%
              </span>
            </div>
          </div>

          <div className="isochrone-field">
            <span className="isochrone-label">Stroke opacity</span>
            <div className="isochrone-slider-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.isochroneStrokeOpacity}
                onChange={(e) => setField("isochroneStrokeOpacity", e.target.value)}
              />
              <span className="isochrone-slider-value">
                {Math.round(Number(form.isochroneStrokeOpacity) * 100)}%
              </span>
            </div>
          </div>

          <div className="isochrone-field">
            <span className="isochrone-label">Stroke width</span>
            <div className="isochrone-slider-row">
              <input
                type="range"
                min="0.5"
                max="6"
                step="0.5"
                value={form.isochroneStrokeWidth}
                onChange={(e) => setField("isochroneStrokeWidth", e.target.value)}
              />
              <span className="isochrone-slider-value">{form.isochroneStrokeWidth}px</span>
            </div>
          </div>

          {/* Custom center */}
          <div className="toggle-field isochrone-field" style={{ marginBottom: 8 }}>
            <span className="isochrone-label">Custom center</span>
            <label className="theme-switch">
              <input
                type="checkbox"
                name="isochroneCustomCenter"
                checked={form.isochroneCustomCenter}
                onChange={(e) => setField("isochroneCustomCenter", e.target.checked)}
              />
              <span className="theme-switch-track" aria-hidden="true" />
            </label>
          </div>

          {form.isochroneCustomCenter && (
            <div className="isochrone-center-inputs">
              <div className="isochrone-coord-row">
                <label className="isochrone-coord-label">Lat</label>
                <input
                  type="number"
                  className="isochrone-coord-input"
                  step="any"
                  value={form.isochroneCenterLat}
                  onChange={(e) => setField("isochroneCenterLat", e.target.value)}
                  placeholder="52.3759"
                />
              </div>
              <div className="isochrone-coord-row">
                <label className="isochrone-coord-label">Lon</label>
                <input
                  type="number"
                  className="isochrone-coord-input"
                  step="any"
                  value={form.isochroneCenterLon}
                  onChange={(e) => setField("isochroneCenterLon", e.target.value)}
                  placeholder="9.7320"
                />
              </div>
              <button
                type="button"
                className="isochrone-center-map-btn"
                onClick={handleUseMapCenter}
              >
                Use map center
              </button>
            </div>
          )}

          {!hasApiKey && (
            <p className="isochrone-status isochrone-status--warn">
              Requires a free ORS API key.{" "}
              <a href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noreferrer">
                Get one here
              </a>
              , then set <code>VITE_ORS_API_KEY</code> in your <code>.env</code>.
            </p>
          )}

          {isochroneLoading && (
            <p className="isochrone-status">Fetching isochrone...</p>
          )}

          {isochroneError && !isochroneLoading && (
            <p className="isochrone-status isochrone-status--error">{isochroneError}</p>
          )}
        </div>
      )}
    </section>
  );
}
