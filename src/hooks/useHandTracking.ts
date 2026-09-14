import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { Hand } from "../gestures";

export type TrackingStatus = "loading" | "ready" | "camera-denied" | "error";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

/**
 * Owns the webcam <video> element, the MediaPipe HandLandmarker instance,
 * and the detection loop. `handsRef` is updated every animation frame
 * without triggering a React re-render, so consumers with their own rAF
 * loop (the gesture engine, the camera preview) can read it cheaply.
 */
export function useHandTracking(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<Hand[]>([]);
  const [status, setStatus] = useState<TrackingStatus>("loading");

  useEffect(() => {
    if (!enabled) return;

    let landmarker: HandLandmarker | null = null;
    let rafId = 0;
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function setup() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 960, height: 720, facingMode: "user" },
          audio: false,
        });

        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");

        const loop = () => {
          if (cancelled || !landmarker || !videoRef.current) return;
          if (videoRef.current.readyState >= 2) {
            const result: HandLandmarkerResult = landmarker.detectForVideo(
              videoRef.current,
              performance.now()
            );
            handsRef.current = result.landmarks as Hand[];
          }
          rafId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        if (cancelled) return;
        console.error("Hand tracking setup failed:", err);
        const name = (err as { name?: string })?.name;
        setStatus(name === "NotAllowedError" ? "camera-denied" : "error");
      }
    }

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
      handsRef.current = [];
    };
  }, [enabled]);

  return { videoRef, handsRef, status };
}
