import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHandTracking } from "./hooks/useHandTracking";
import { GestureEngine, type GestureAction } from "./gestureEngine";
import { SlideViewer } from "./components/SlideViewer";
import { LaserPointer } from "./components/LaserPointer";
import { CameraPreview } from "./components/CameraPreview";
import { GestureToast } from "./components/GestureToast";
import { SettingsPanel } from "./components/SettingsPanel";
import { generateDemoSlides } from "./demo/demoSlides";
import { renderSimpleDeck } from "./lib/simplePresentation";
import "./styles.css";

export default function App() {
  const [slides, setSlides] = useState<string[]>(() => generateDemoSlides());
  const [index, setIndex] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [toast, setToast] = useState<{ type: GestureAction; key: number } | null>(null);

  const { videoRef, handsRef, status } = useHandTracking(gestureEnabled);
  const engine = useMemo(() => new GestureEngine(), []);
  const toastKey = useRef(0);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, slides.length - 1)));
  }, [slides.length]);
  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);
  const toggleBlackout = useCallback(() => setBlackout((b) => !b), []);

  const flashToast = useCallback((type: GestureAction) => {
    toastKey.current += 1;
    setToast({ type, key: toastKey.current });
  }, []);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1100);
    return () => clearTimeout(t);
  }, [toast]);

  // Gesture engine runs its own rAF loop reading handsRef directly, so
  // recognition stays smooth regardless of React's render cadence.
  useEffect(() => {
    if (!gestureEnabled) {
      engine.reset();
      return;
    }
    let rafId = 0;
    const callbacks = {
      onNext: goNext,
      onPrev: goPrev,
      onBlackoutToggle: toggleBlackout,
      onAction: flashToast,
    };
    const loop = () => {
      engine.update(handsRef.current, performance.now(), callbacks);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [gestureEnabled, engine, handsRef, goNext, goPrev, toggleBlackout, flashToast]);

  // Keyboard fallback: arrows/space to navigate, B for blackout, F for fullscreen.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "b":
        case "B":
          toggleBlackout();
          break;
        case "f":
        case "F":
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen().catch(() => {});
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, toggleBlackout]);

  async function handleLoadPdf(file: File) {
    // pdfjs-dist is a large dependency — only fetched when a PDF is actually loaded.
    const { loadPdfSlides } = await import("./lib/loadSlides");
    const loaded = await loadPdfSlides(file);
    if (loaded.length) {
      setSlides(loaded);
      setIndex(0);
      setPanelOpen(false);
    }
  }

  async function handleLoadImages(files: File[]) {
    const { loadImageSlides } = await import("./lib/loadSlides");
    const loaded = await loadImageSlides(files);
    if (loaded.length) {
      setSlides(loaded);
      setIndex(0);
      setPanelOpen(false);
    }
  }

  function handleLoadDemo() {
    setSlides(generateDemoSlides());
    setIndex(0);
  }

  function handleLoadSimple(text: string) {
    const rendered = renderSimpleDeck(text);
    if (rendered.length) {
      setSlides(rendered);
      setIndex(0);
    }
  }

  return (
    <div className={`app ${blackout ? "app-blackout" : ""}`}>
      <SlideViewer slides={slides} index={index} blackout={blackout} />
      <LaserPointer engine={engine} />
      <GestureToast action={toast} />
      {gestureEnabled && <CameraPreview videoRef={videoRef} status={status} visible={showCameraPreview} />}

      <SettingsPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onLoadPdf={handleLoadPdf}
        onLoadImages={handleLoadImages}
        onLoadDemo={handleLoadDemo}
        onLoadSimple={handleLoadSimple}
        gestureEnabled={gestureEnabled}
        onToggleGesture={() => setGestureEnabled((v) => !v)}
        showCameraPreview={showCameraPreview}
        onToggleCameraPreview={() => setShowCameraPreview((v) => !v)}
        status={status}
        slideCount={slides.length}
      />
    </div>
  );
}
