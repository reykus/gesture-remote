import { useRef, useState } from "react";
import type { TrackingStatus } from "../hooks/useHandTracking";
import { SIMPLE_DECK_PLACEHOLDER } from "../lib/simplePresentation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadPdf: (file: File) => void;
  onLoadImages: (files: File[]) => void;
  onLoadDemo: () => void;
  onLoadSimple: (text: string) => void;
  gestureEnabled: boolean;
  onToggleGesture: () => void;
  showCameraPreview: boolean;
  onToggleCameraPreview: () => void;
  status: TrackingStatus;
  slideCount: number;
};

export function SettingsPanel({
  open,
  onOpenChange,
  onLoadPdf,
  onLoadImages,
  onLoadDemo,
  onLoadSimple,
  gestureEnabled,
  onToggleGesture,
  showCameraPreview,
  onToggleCameraPreview,
  status,
  slideCount,
}: Props) {
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imagesInputRef = useRef<HTMLInputElement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(SIMPLE_DECK_PLACEHOLDER);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? "Close settings" : "Open settings"}
      >
        {open ? "×" : "☰"}
      </button>

      {open && (
        <div className="settings-panel">
          <h1>Gesture Remote</h1>

          <section>
            <h2>Deck</h2>
            <p className="hint">{slideCount} slide{slideCount === 1 ? "" : "s"} loaded.</p>
            <button type="button" className="panel-button" onClick={() => pdfInputRef.current?.click()}>
              Load a PDF
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onLoadPdf(file);
                e.target.value = "";
              }}
            />
            <button type="button" className="panel-button" onClick={() => imagesInputRef.current?.click()}>
              Load images
            </button>
            <input
              ref={imagesInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) onLoadImages(files);
                e.target.value = "";
              }}
            />
            <button type="button" className="panel-button panel-button-secondary" onClick={onLoadDemo}>
              Use demo deck
            </button>
            <button
              type="button"
              className="panel-button panel-button-secondary"
              onClick={() => setEditorOpen((v) => !v)}
            >
              {editorOpen ? "Close simple editor" : "Write simple slides"}
            </button>
            {editorOpen && (
              <div className="simple-editor">
                <p className="hint">
                  One slide per block. Start a line with "# " for a title,
                  "- " for a bullet, separate slides with a line of "---".
                </p>
                <textarea
                  className="simple-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  spellCheck={false}
                  rows={10}
                />
                <button
                  type="button"
                  className="panel-button"
                  onClick={() => {
                    onLoadSimple(draft);
                    setEditorOpen(false);
                  }}
                >
                  Generate slides
                </button>
              </div>
            )}
          </section>

          <section>
            <h2>Hand tracking</h2>
            <label className="switch-row">
              <input type="checkbox" checked={gestureEnabled} onChange={onToggleGesture} />
              <span>Enable camera + gestures</span>
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={showCameraPreview}
                onChange={onToggleCameraPreview}
                disabled={!gestureEnabled}
              />
              <span>Show camera preview</span>
            </label>
            {gestureEnabled && <p className="hint">Status: {status}</p>}
          </section>

          <section>
            <h2>Gestures</h2>
            <ul className="gesture-help">
              <li>Open palm, swipe right — next slide</li>
              <li>Open palm, swipe left — previous slide</li>
              <li>Point with one finger — laser pointer</li>
              <li>Hold a fist ~1s — toggle blackout</li>
            </ul>
          </section>

          <section>
            <h2>Keyboard</h2>
            <ul className="gesture-help">
              <li>→ / Space — next slide</li>
              <li>← — previous slide</li>
              <li>B — toggle blackout</li>
              <li>F — toggle fullscreen</li>
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
