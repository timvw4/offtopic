"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";

type Stroke =
  | { kind: "stroke"; color: string; size: number; points: { x: number; y: number }[] }
  | { kind: "fill"; color: string; x: number; y: number };

interface Props {
  onExport: (dataUrl: string) => void;
  disabled?: boolean;
}

export interface DrawingCanvasHandle {
  exportImage: () => string | null;
}

const colors = [
  "#000000", // noir
  "#ffffff", // blanc (placé à côté du noir)
  "#9ca3af", // gris
  "#8b4513", // brun
  "#ef4444", // rouge
  "#22c55e", // vert (unique)
  "#1d4ed8", // bleu foncé (plus sombre)
  "#a855f7", // violet
  "#f59e0b", // orange
  "#0ea5e9", // bleu clair
  "#ec4899", // rose
  "#facc15", // jaune (nouvelle couleur)
];

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { onExport, disabled }: Props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [hasDrawnInCurrentStroke, setHasDrawnInCurrentStroke] = useState(false);
  const [brushColor, setBrushColor] = useState(colors[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [size, setSize] = useState(360);
  const [fillMode, setFillMode] = useState(false);
  // Références pour disposer des états les plus récents dans undo/redo
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    redoRef.current = redoStrokes;
  }, [redoStrokes]);

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

  // Convertit un hex (#rrggbb ou #rgb) en composantes RGBA
  function hexToRgba(hex: string) {
    let h = hex.replace("#", "");
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b, a: 255 };
  }

  // Remplit une zone contiguë (style pot de peinture)
  const applyFill = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const { width, height } = ctx.canvas;
    const data = ctx.getImageData(0, 0, width, height);
    const target = (y | 0) * width + (x | 0);
    const rgba = data.data;
    const startR = rgba[target * 4 + 0];
    const startG = rgba[target * 4 + 1];
    const startB = rgba[target * 4 + 2];
    const startA = rgba[target * 4 + 3];
    const fill = hexToRgba(color);

    // Si la couleur est déjà identique, on évite un flood-fill inutile
    if (startR === fill.r && startG === fill.g && startB === fill.b && startA === fill.a) return;

    const queue: [number, number][] = [[x | 0, y | 0]];
    const match = (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= width || py >= height) return false;
      const idx = (py * width + px) * 4;
      return (
        rgba[idx + 0] === startR &&
        rgba[idx + 1] === startG &&
        rgba[idx + 2] === startB &&
        rgba[idx + 3] === startA
      );
    };

    while (queue.length) {
      const [qx, qy] = queue.pop()!;
      if (!match(qx, qy)) continue;
      let lx = qx;
      let rx = qx;
      // Étend vers la gauche
      while (match(lx - 1, qy)) lx--;
      // Étend vers la droite
      while (match(rx + 1, qy)) rx++;
      for (let i = lx; i <= rx; i++) {
        const idx = (qy * width + i) * 4;
        rgba[idx + 0] = fill.r;
        rgba[idx + 1] = fill.g;
        rgba[idx + 2] = fill.b;
        rgba[idx + 3] = fill.a;
        if (match(i, qy - 1)) queue.push([i, qy - 1]);
        if (match(i, qy + 1)) queue.push([i, qy + 1]);
      }
    }
    ctx.putImageData(data, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (stroke.kind === "stroke") {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        stroke.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else {
        applyFill(ctx, Math.round(stroke.x), Math.round(stroke.y), stroke.color);
      }
    }
  }, [strokes, applyFill]);

  // Calcule la position exacte sur le canvas en tenant compte du ratio
  // entre la taille CSS (rect) et la taille réelle du canvas (width/height).
  // Sans ce ratio, le trait peut apparaître décalé par rapport au curseur
  // ou au doigt, surtout sur les écrans haute densité (mobile).
  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const client = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (client.clientX - rect.left) * scaleX,
      y: (client.clientY - rect.top) * scaleY,
    };
  }

  function start(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return;
    const pos = getPos(e);
    // Mode remplissage (pot de peinture)
    if (fillMode) {
      setCurrent(null);
      setHasDrawnInCurrentStroke(false);
      setRedoStrokes([]);
      const fillStroke: Stroke = { kind: "fill", color: brushColor, x: pos.x, y: pos.y };
      // On enregistre l'opération et le useEffect de rendu refait tout
      setStrokes((prev) => [...prev, fillStroke]);
      return;
    }
    // Un nouveau trait annule l'historique de "refaire" pour rester cohérent
    setRedoStrokes([]);
    setHasDrawnInCurrentStroke(false);
    const stroke: Stroke = { kind: "stroke", color: brushColor, size: brushSize, points: [pos] };
    setCurrent(stroke);
    // On ajoute immédiatement le nouveau trait dans la liste, pour ne pas
    // écraser le précédent au premier mouvement.
    setStrokes((prev) => [...prev, stroke]);
  }

  function move(e: React.TouchEvent | React.MouseEvent) {
    if (!current || current.kind !== "stroke") return;
    setHasDrawnInCurrentStroke(true);
    const pos = getPos(e);
    const updated: Stroke = { ...current, points: [...current.points, pos] };
    setCurrent(updated);
    // Remplace la dernière entrée (le trait en cours) par sa version étendue.
    setStrokes((prev) => {
      if (!prev.length) return [updated];
      const copy = [...prev];
      copy[copy.length - 1] = updated;
      return copy;
    });
  }

  function end() {
    if (current) {
      setRedoStrokes([]); // Nouveau trait => plus rien à "refaire"
      setCurrent(null);
    }
  }

  function undo() {
    if (disabled) return;
    // On termine proprement tout trait en cours avant de revenir en arrière
    setCurrent(null);
    const prev = strokesRef.current;
    if (!prev.length) return;
    const undone = prev[prev.length - 1];
    setStrokes(prev.slice(0, -1));
    setRedoStrokes([...redoRef.current, undone]);
  }

  function redo() {
    if (disabled) return;
    setCurrent(null);
    const prevRedo = redoRef.current;
    if (!prevRedo.length) return;
    const restored = prevRedo[prevRedo.length - 1];
    setStrokes([...strokesRef.current, restored]);
    setRedoStrokes(prevRedo.slice(0, -1));
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

  return (
    <div className="card drawing-card" style={{ display: "grid", gap: 12, padding: 18 }} ref={containerRef}>
      <div
        className="panel drawing-controls"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-start" }}>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              className="color-swatch"
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
        <button
          type="button"
          className="btn btn-compact btn-ghost"
          onClick={undo}
          disabled={disabled || strokes.length === 0}
          aria-label="Annuler le dernier trait"
          title="Annuler le dernier trait"
        >
          ←
        </button>
        <button
          type="button"
          className="btn btn-compact btn-ghost"
          onClick={redo}
          disabled={disabled || redoStrokes.length === 0}
          aria-label="Rétablir le trait annulé"
          title="Rétablir le trait annulé"
        >
          →
        </button>
        <button
          type="button"
          className="btn btn-compact"
          aria-pressed={fillMode}
          onClick={() => setFillMode((v) => !v)}
          style={{
            background: fillMode ? "rgba(250, 204, 21, 0.54)" : undefined,
            border: fillMode ? "1px solid rgba(250,204,21,0.6)" : undefined,
          }}
          title="Pot de peinture (remplir une zone)"
        >
          <Image
            src="/bucket.png"
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            style={{ display: "block", objectFit: "contain" }}
          />
        </button>
        <button type="button" className="btn btn-compact" onClick={exportImage} disabled={disabled}>
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
