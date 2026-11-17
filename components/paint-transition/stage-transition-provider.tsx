"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  PaintTransitionOverlay,
  type TransitionPhase,
  type TransitionStyle,
} from "./paint-transition-overlay";

const INCOMING_KEY = "paint-transition-incoming";
const STYLE_STORAGE_KEY = "paint-transition-style";

interface NavigationOrigin {
  x: number;
  y: number;
}

interface StageTransitionContextType {
  navigateTo: (href: string, originCoords?: NavigationOrigin) => void;
  isOpening: boolean;
  styleMode: TransitionStyle;
  setStyleMode: (mode: TransitionStyle) => void;
}

const StageTransitionContext = createContext<StageTransitionContextType | null>(
  null
);

export function useStageTransition() {
  const context = useContext(StageTransitionContext);
  if (!context) {
    throw new Error(
      "useStageTransition must be used within a StageTransitionProvider"
    );
  }
  return context;
}

export function StageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [phase, setPhase] = useState<TransitionPhase>("IDLE");
  const [clickOrigin, setClickOrigin] = useState<NavigationOrigin | null>(null);
  const [styleMode, setStyleModeState] = useState<TransitionStyle>("SLICED_CURTAIN");

  // Read saved style or URL query override (?transition=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const paramStyle = urlParams.get("transition")?.toUpperCase() as TransitionStyle;
    const validStyles: TransitionStyle[] = [
      "BRUSH_SWEEP",
      "INK_DIFFUSION",
      "SLICED_CURTAIN",
      "RIPPLE_ECHO",
    ];

    if (paramStyle && validStyles.includes(paramStyle)) {
      setStyleModeState(paramStyle);
      localStorage.setItem(STYLE_STORAGE_KEY, paramStyle);
      return;
    }

    const saved = localStorage.getItem(STYLE_STORAGE_KEY) as TransitionStyle;
    if (saved && validStyles.includes(saved)) {
      setStyleModeState(saved);
    }
  }, []);

  const setStyleMode = useCallback((mode: TransitionStyle) => {
    setStyleModeState(mode);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, mode);
    } catch {}
  }, []);

  const phaseRef = useRef<TransitionPhase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // When pathname changes (i.e. Next.js router swapped to destination page)
  useEffect(() => {
    let animFrame: number | null = null;

    if (phaseRef.current === "COVERED") {
      animFrame = requestAnimationFrame(() => {
        setPhase("REVEALING");
      });
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [pathname]);

  const navigateTo = useCallback(
    (href: string, originCoords?: NavigationOrigin) => {
      if (phase !== "IDLE") return;
      if (href === pathname) return;

      const coords = originCoords ?? {
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
      };

      setClickOrigin(coords);

      try {
        sessionStorage.setItem(INCOMING_KEY, JSON.stringify(coords));
      } catch {}

      setPhase("COVERING");
    },
    [phase, pathname]
  );

  const handleCovered = useCallback(() => {
    setPhase("COVERED");
    const targetDest = sessionStorage.getItem("__target_dest") || pathname;
    startTransition(() => {
      router.push(targetDest);
    });
  }, [pathname, router]);

  const handleRevealed = useCallback(() => {
    setPhase("IDLE");
    setClickOrigin(null);
  }, []);

  const handleNavigate = useCallback(
    (href: string, originCoords?: NavigationOrigin) => {
      if (phase !== "IDLE" || href === pathname) return;
      try {
        sessionStorage.setItem("__target_dest", href);
      } catch {}
      navigateTo(href, originCoords);
    },
    [phase, pathname, navigateTo]
  );

  return (
    <StageTransitionContext.Provider
      value={{
        navigateTo: handleNavigate,
        isOpening: phase === "COVERING" || phase === "COVERED",
        styleMode,
        setStyleMode,
      }}
    >
      <PaintTransitionOverlay
        phase={phase}
        origin={clickOrigin}
        styleMode={styleMode}
        onCovered={handleCovered}
        onRevealed={handleRevealed}
      />
      {children}
    </StageTransitionContext.Provider>
  );
}
