"use client";

import React, { useEffect, useRef } from "react";

export type TransitionStyle =
  | "BRUSH_SWEEP"      // Wide calligraphic wet ink / gouache brush stroke sweep
  | "INK_DIFFUSION"    // Organic watercolor / ink bleed into damp paper fiber
  | "SLICED_CURTAIN"   // Geometric staggered vertical canvas slats sliding across
  | "RIPPLE_ECHO";     // Concentric liquid ink wave rings propagating outward

export type TransitionPhase = "IDLE" | "COVERING" | "COVERED" | "REVEALING";

interface PaintTransitionOverlayProps {
  phase: TransitionPhase;
  origin?: { x: number; y: number } | null;
  styleMode?: TransitionStyle;
  onCovered?: () => void;
  onRevealed?: () => void;
}

// Brand Editorial Color Constants
const COLOR_NIGHT = "#141413";
const COLOR_TERRACOTTA = "#D97757";
const COLOR_TEAL = "#04A4BA";
const COLOR_CREAM = "#1c1c1a";
const COLOR_CARD = "#262522";

// ── 1. BRUSH_SWEEP: Broad calligraphic brush ribbons ───────────────────────
function drawBrushSweep(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  progress: number,
  isReveal: boolean
) {
  // If revealing, we invert or wipe clear
  ctx.save();
  if (isReveal) {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  // 5 sweeping parallel angled calligraphic strokes
  const strokeCount = 6;
  const ribbonHeight = (h * 1.5) / strokeCount;
  const angle = -0.22; // slight natural upward slant like a Japanese calligraphy stroke

  for (let i = 0; i < strokeCount; i++) {
    // Stagger by distance from origin Y and row
    const rowY = (i * (h / (strokeCount - 1))) - h * 0.15;
    const distFactor = Math.abs(rowY - oy) / (h || 1);
    const delay = distFactor * 0.22 + (i * 0.05);
    const t = Math.max(0, Math.min(1, (progress - delay) / (1 - delay * 0.6)));
    if (t <= 0) continue;

    // Fluid custom cubic bezier ease (starts measured, glides smoothly)
    const ease = 1 - Math.pow(1 - t, 2.6);
    const strokeWidth = (w * 1.6) * ease;

    ctx.save();
    ctx.translate(ox, rowY);
    ctx.rotate(angle);

    // Color gradient across ribbons
    const colors = [COLOR_TERRACOTTA, COLOR_NIGHT, COLOR_TEAL, COLOR_CREAM, COLOR_TERRACOTTA, COLOR_CARD];
    ctx.fillStyle = colors[i % colors.length];

    // Draw textured bristle ribbon with organic wavy frayed bristles
    ctx.beginPath();
    const halfH = ribbonHeight * 0.75;
    ctx.moveTo(-w * 0.4, -halfH);

    // Top wavy edge (bristle texture)
    for (let x = -w * 0.4; x <= strokeWidth; x += 40) {
      const bristleNoise = Math.sin(x * 0.03 + i * 5) * 8 + Math.cos(x * 0.07) * 4;
      ctx.lineTo(x, -halfH + bristleNoise);
    }

    // Frayed brush head curve at leading edge
    for (let step = 0; step <= 10; step++) {
      const frac = step / 10;
      const headY = -halfH + frac * (halfH * 2);
      const bristleTip = strokeWidth + Math.sin(step * 4 + i) * 18 - (frac * frac * 25);
      ctx.lineTo(bristleTip, headY);
    }

    // Bottom wavy edge
    for (let x = strokeWidth; x >= -w * 0.4; x -= 40) {
      const bristleNoise = Math.sin(x * 0.04 + i) * 8 + Math.cos(x * 0.09) * 3;
      ctx.lineTo(x, halfH + bristleNoise);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Final veil pass for 100% opacity seal
  if (!isReveal && progress > 0.88) {
    const alpha = (progress - 0.88) / 0.12;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = COLOR_NIGHT;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

// ── 2. INK_DIFFUSION: Watercolor / Marbling Ink Bleed ───────────────────────
function drawInkDiffusion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  progress: number,
  isReveal: boolean
) {
  ctx.save();
  if (isReveal) {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  const screenDiag = Math.hypot(w, h);
  const numTendrils = 32;

  // Multiple expanding organic blooms
  const blooms = [
    { x: ox, y: oy, maxR: screenDiag * 1.3, color: COLOR_TERRACOTTA, speed: 1.0, delay: 0 },
    { x: ox + 40, y: oy - 30, maxR: screenDiag * 1.25, color: COLOR_TEAL, speed: 1.05, delay: 0.05 },
    { x: ox - 50, y: oy + 40, maxR: screenDiag * 1.2, color: COLOR_NIGHT, speed: 0.95, delay: 0.09 },
  ];

  for (const b of blooms) {
    const t = Math.max(0, (progress - b.delay) / (1 - b.delay));
    if (t <= 0) continue;

    // Natural viscous fluid absorption curve
    const ease = 1 - Math.pow(1 - Math.min(1, t * b.speed), 2.4);
    const r = b.maxR * ease;

    ctx.fillStyle = b.color;
    ctx.beginPath();

    for (let i = 0; i <= numTendrils; i++) {
      const angle = (i / numTendrils) * Math.PI * 2;
      // Fractal/harmonic organic distortion simulating porous paper absorption
      const variance =
        1.0 +
        0.22 * Math.sin(angle * 4 + b.delay * 10) +
        0.14 * Math.cos(angle * 7 - b.delay * 5) +
        0.08 * Math.sin(angle * 13);
      const rad = r * variance;
      const px = b.x + Math.cos(angle) * rad;
      const py = b.y + Math.sin(angle) * rad;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.fill();
  }

  if (!isReveal && progress > 0.86) {
    const alpha = (progress - 0.86) / 0.14;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = COLOR_NIGHT;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

// ── 3. SLICED_CURTAIN: Staggered architectural Venetian vertical louvers ───
// Pre-configured variable weight and physical parameters for organic non-uniform kinematics
const SLAT_PROFILES = [
  { speedMult: 1.25, accelExponent: 2.2, delayOffset: 0.00 },
  { speedMult: 0.95, accelExponent: 3.4, delayOffset: 0.04 },
  { speedMult: 1.35, accelExponent: 2.6, delayOffset: 0.01 },
  { speedMult: 1.05, accelExponent: 3.8, delayOffset: 0.06 },
  { speedMult: 1.15, accelExponent: 2.0, delayOffset: 0.02 },
  { speedMult: 1.40, accelExponent: 3.2, delayOffset: 0.05 },
  { speedMult: 0.90, accelExponent: 2.8, delayOffset: 0.03 },
  { speedMult: 1.20, accelExponent: 3.6, delayOffset: 0.07 },
];

function drawSlicedCurtain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  _oy: number,
  progress: number,
  isReveal: boolean
) {
  ctx.save();
  const columns = 8;
  const colWidth = Math.ceil(w / columns);
  const colors = [COLOR_NIGHT, COLOR_CARD, COLOR_TERRACOTTA, COLOR_CREAM, COLOR_TEAL];

  if (!isReveal) {
    // ── OUTRO / COVER: Non-uniform acceleration & smooth inertia deceleration ──
    ctx.globalCompositeOperation = "source-over";

    for (let c = 0; c < columns; c++) {
      const colX = c * colWidth;
      const colCenter = colX + colWidth / 2;
      const distNorm = Math.abs(colCenter - ox) / (w || 1);

      const profile = SLAT_PROFILES[c % SLAT_PROFILES.length];

      // Variable individual stagger combining distance from click + per-slat delay offset
      const delay = distNorm * 0.28 + profile.delayOffset;
      const t = Math.max(0, (progress - delay) / (1 - delay));
      if (t <= 0) continue;

      // Variable acceleration into elastic viscous deceleration:
      // Starts with variable inertia, accelerates smoothly through the midpoint,
      // and cushions into rest (no constant mechanical linear velocity).
      const scaledT = Math.min(1, t * profile.speedMult);
      const ease = 1 - Math.pow(1 - scaledT, profile.accelExponent);
      const currentH = Math.min(h + 2, (h + 2) * ease);

      ctx.fillStyle = colors[c % colors.length];

      const fromTop = c % 2 === 0;
      const yPos = fromTop ? 0 : h - currentH;

      ctx.fillRect(colX, yPos, colWidth + 1, currentH);
    }

    // When covering finishes: ensure the slats at full extension remain rendered
    if (progress >= 1.0) {
      for (let c = 0; c < columns; c++) {
        const colX = c * colWidth;
        ctx.fillStyle = colors[c % colors.length];
        ctx.fillRect(colX, 0, colWidth + 1, h);
      }
    }
  } else {
    // ── INTRO / REVEAL: Variable accelerated peel-back in reverse ──
    for (let c = 0; c < columns; c++) {
      const colX = c * colWidth;
      const colCenter = colX + colWidth / 2;
      const distNorm = Math.abs(colCenter - ox) / (w || 1);

      const profile = SLAT_PROFILES[c % SLAT_PROFILES.length];

      const delay = distNorm * 0.28 + profile.delayOffset;
      const t = Math.max(0, (progress - delay) / (1 - delay));

      // Asymmetric acceleration: starts heavy, accelerates away with power
      const scaledT = Math.min(1, t * profile.speedMult);
      const ease = Math.pow(scaledT, profile.accelExponent);
      const remainingH = Math.max(0, (h + 2) * (1 - ease));

      const fromTop = c % 2 === 0;

      if (remainingH > 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = colors[c % colors.length];

        const yPos = fromTop ? 0 : h - remainingH;
        ctx.fillRect(colX, yPos, colWidth + 1, remainingH);
      }
    }
  }

  ctx.restore();
}

// ── 4. RIPPLE_ECHO: Concentric fluid wave crests ────────────────────────────
function drawRippleEcho(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  progress: number,
  isReveal: boolean
) {
  ctx.save();
  if (isReveal) {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  const screenDiag = Math.hypot(w, h);
  const rings = 4;

  for (let r = 0; r < rings; r++) {
    const delay = r * 0.08;
    const t = Math.max(0, (progress - delay) / (1 - delay));
    if (t <= 0) continue;

    const ease = 1 - Math.pow(1 - Math.min(1, t), 3);
    const radius = screenDiag * 1.25 * ease;

    const colors = [COLOR_TERRACOTTA, COLOR_TEAL, COLOR_CARD, COLOR_NIGHT];
    ctx.fillStyle = colors[r % colors.length];

    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!isReveal && progress > 0.88) {
    const alpha = (progress - 0.88) / 0.12;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = COLOR_NIGHT;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

export function PaintTransitionOverlay({
  phase,
  origin,
  styleMode = "SLICED_CURTAIN",
  onCovered,
  onRevealed,
}: PaintTransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const onCoveredRef = useRef(onCovered);
  const onRevealedRef = useRef(onRevealed);

  useEffect(() => {
    onCoveredRef.current = onCovered;
    onRevealedRef.current = onRevealed;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    if (phase === "IDLE") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return () => window.removeEventListener("resize", resize);
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ox = origin?.x ?? w / 2;
    const oy = origin?.y ?? h / 2;

    if (phase === "COVERED") {
      ctx.globalCompositeOperation = "source-over";
      if (styleMode === "SLICED_CURTAIN") {
        drawSlicedCurtain(ctx, w, h, ox, oy, 1.0, false);
      } else {
        ctx.fillStyle = COLOR_NIGHT;
        ctx.fillRect(0, 0, w, h);
      }
      return () => {
        window.removeEventListener("resize", resize);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    let startTime: number | null = null;

    const renderDispatch = (prog: number, isReveal: boolean) => {
      switch (styleMode) {
        case "BRUSH_SWEEP":
          drawBrushSweep(ctx, w, h, ox, oy, prog, isReveal);
          break;
        case "INK_DIFFUSION":
          drawInkDiffusion(ctx, w, h, ox, oy, prog, isReveal);
          break;
        case "SLICED_CURTAIN":
          drawSlicedCurtain(ctx, w, h, ox, oy, prog, isReveal);
          break;
        case "RIPPLE_ECHO":
          drawRippleEcho(ctx, w, h, ox, oy, prog, isReveal);
          break;
      }
    };

    // Calibrated relaxed, intentional durations per style
    const getDurations = () => {
      switch (styleMode) {
        case "INK_DIFFUSION":
          return { cover: 820, reveal: 780 };
        case "BRUSH_SWEEP":
          return { cover: 740, reveal: 700 };
        case "SLICED_CURTAIN":
          return { cover: 760, reveal: 720 };
        case "RIPPLE_ECHO":
          return { cover: 780, reveal: 740 };
      }
    };

    const { cover: DURATION, reveal: REVEAL_DURATION } = getDurations();

    if (phase === "COVERING") {
      const step = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / DURATION);

        ctx.clearRect(0, 0, w, h);
        renderDispatch(progress, false);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          ctx.globalCompositeOperation = "source-over";
          if (styleMode === "SLICED_CURTAIN") {
            drawSlicedCurtain(ctx, w, h, ox, oy, 1.0, false);
          } else {
            ctx.fillStyle = COLOR_NIGHT;
            ctx.fillRect(0, 0, w, h);
          }
          onCoveredRef.current?.();
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    } else if (phase === "REVEALING") {
      const step = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / REVEAL_DURATION);

        ctx.clearRect(0, 0, w, h);

        if (styleMode !== "SLICED_CURTAIN") {
          // For diffusion/ripple: solid background base then punched out
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = COLOR_NIGHT;
          ctx.fillRect(0, 0, w, h);
        }

        // Peel back via style dispatch
        renderDispatch(progress, true);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          ctx.clearRect(0, 0, w, h);
          onRevealedRef.current?.();
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, origin, styleMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[9999] h-full w-full select-none ${
        phase === "IDLE" ? "hidden" : "block"
      }`}
    />
  );
}
