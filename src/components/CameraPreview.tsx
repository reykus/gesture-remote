import type { RefObject } from "react";
import type { TrackingStatus } from "../hooks/useHandTracking";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: TrackingStatus;
  visible: boolean;
};

const statusLabel: Record<TrackingStatus, string> = {
  loading: "Starting…",
  ready: "Tracking",
  "camera-denied": "Camera blocked",
  error: "Tracker error",
};

export function CameraPreview({ videoRef, status, visible }: Props) {
  if (!visible) return null;

  return (
    <div className="camera-preview">
      <video ref={videoRef} className="camera-preview-video" playsInline muted autoPlay />
      <div className={`camera-preview-status status-${status}`}>
        <span className="status-dot" />
        {statusLabel[status]}
      </div>
    </div>
  );
}
