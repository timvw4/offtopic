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

const colors = ["#000000", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];

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
    <div className="card" style={{ display: "grid", gap: 8 }} ref={containerRef}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {colors.map((c) => (
          <button
            key={c}
            className="btn"
            style={{ background: c, color: "#fff" }}
            onClick={() => setBrushColor(c)}
            aria-label={`Choisir la couleur ${c}`}
          >
            🎨
          </button>
        ))}
        <label style={{ color: "#e2e8f0" }}>
          Taille
          <input
            type="range"
            min={2}
            max={14}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>
        <button className="btn" onClick={undo}>
          Annuler
        </button>
        <button className="btn" onClick={erase}>
          Gomme
        </button>
        <button className="btn" onClick={exportImage} disabled={disabled}>
          Sauver le dessin
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ borderRadius: 12, touchAction: "none", background: "#fff", width: "100%", maxWidth: size }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
    </div>
  );
});
