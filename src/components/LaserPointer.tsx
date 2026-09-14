import { useEffect, useRef } from "react";
import type { GestureEngine } from "../gestureEngine";

type Props = {
  engine: GestureEngine;
};

export function LaserPointer({ engine }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let rafId = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (engine.pointer.active) {
        const x = engine.pointer.x * width;
        const y = engine.pointer.y * height;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
        glow.addColorStop(0, "rgba(255, 90, 60, 0.9)");
        glow.addColorStop(0.4, "rgba(255, 90, 60, 0.35)");
        glow.addColorStop(1, "rgba(255, 90, 60, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 230, 220, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [engine]);

  return <canvas ref={canvasRef} className="pointer-canvas" />;
}
