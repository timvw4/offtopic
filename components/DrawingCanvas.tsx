"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

type Stroke = { color: string; size: number; points: { x: number; y: number }[] };

interface Props {
  onExport: (dataUrl: string) => void;
  disabled?: boolean;
}

export interface DrawingCanvasHandle {
  exportImage: () => string | null;
}

const colors = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ffffff",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#ec4899",
];

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { onExport, disabled }: Props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState(colors[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [size, setSize] = useState(360);

  // Resize le canvas pour occuper presque toute la largeur disponible (mobile-friendly).
  useEffect(() => {
    function resize() {
      const w = containerRef.current?.clientWidth || 360;
      const target = Math.min(900, Math.max(280, w));
      setSize(target);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      stroke.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  }, [strokes]);

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const client = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: client.clientX - rect.left, y: client.clientY - rect.top };
  }

  function start(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return;
    const pos = getPos(e);
    setCurrent({ color: brushColor, size: brushSize, points: [pos] });
  }

  function move(e: React.TouchEvent | React.MouseEvent) {
    if (!current) return;
    const pos = getPos(e);
    setCurrent({ ...current, points: [...current.points, pos] });
    setStrokes((prev) => [...prev.slice(0, -1), { ...current, points: [...current.points, pos] }]);
  }

  function end() {
    if (current) {
      setStrokes((prev) => [...prev, current]);
      setCurrent(null);
    }
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function erase() {
    setStrokes([]);
  }

  function exportImage() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL("image/png");
    onExport(dataUrl);
    return dataUrl;
  }

  useImperativeHandle(
    ref,
    () => ({
      exportImage: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL("image/png");
      },
    }),
    [],
  );

  useEffect(() => {
    setStrokes((prev) => (current ? [...prev.slice(0, -1), current] : prev));
  }, [current]);

  return (
    <div className="card" style={{ display: "grid", gap: 12, padding: 18 }} ref={containerRef}>
      <div className="panel" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-start" }}>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              style={{
                background: c,
                color: "transparent",
                width: 34,
                minWidth: 34,
                height: 34,
                padding: 0,
                borderRadius: "50%",
                aspectRatio: "1 / 1",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 34px",
                lineHeight: "0",
                boxSizing: "border-box",
                fontSize: 0,
                border: "2px solid rgba(255,255,255,0.35)",
                boxShadow: brushColor === c ? "0 0 0 3px rgba(250,204,21,0.5)" : "none",
              }}
              onClick={() => setBrushColor(c)}
              aria-label={`Choisir la couleur ${c}`}
            >
              {/* pastille */}
            </button>
          ))}
        </div>
        <label style={{ color: "var(--text)", display: "grid", gap: 4, textAlign: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14, justifySelf: "center" }}>Taille</span>
          <input
            type="range"
            min={2}
            max={14}
            value={brushSize}
            className="size-slider"
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>
        <button className="btn btn-compact btn-ghost" onClick={undo}>
          Gomme
        </button>
        <button className="btn btn-compact" onClick={exportImage} disabled={disabled}>
          Valider
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          borderRadius: 16,
          touchAction: "none",
          background: "#ffffff",
          width: "100%",
          maxWidth: size,
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <style jsx>{`
        .size-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 160px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(250, 204, 21, 0.25), rgba(168, 85, 247, 0.35));
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          cursor: pointer;
        }
        .size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #a855f7;
          border: 2px solid #0b0f1a;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.35);
        }
        .size-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #a855f7;
          border: 2px solid #0b0f1a;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.35);
        }
        .size-slider::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(250, 204, 21, 0.25), rgba(168, 85, 247, 0.35));
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
});
