"use client";

import { useEffect } from "react";

/**
 * Client-side guard that patches SVGElement.prototype to prevent
 * cross-origin "correspondingUseElement" / "nodeType" errors
 * common in Safari and some Chromium builds.
 *
 * Rendered as a client component (not <Script>) to stay compatible
 * with React 19, which disallows raw <script> tags in the component tree.
 */
export function SvgElementGuard() {
  useEffect(() => {
    try {
      if (
        typeof SVGElement !== "undefined" &&
        SVGElement.prototype
      ) {
        Object.defineProperty(
          SVGElement.prototype,
          "correspondingUseElement",
          {
            get() {
              return null;
            },
            set() {},
            configurable: true,
          },
        );
        Object.defineProperty(
          SVGElement.prototype,
          "correspondingElement",
          {
            get() {
              return null;
            },
            set() {},
            configurable: true,
          },
        );
      }
    } catch {
      /* silently ignore environments that do not support SVG */
    }

    function handleError(e: ErrorEvent) {
      const msg = e?.message ? String(e.message) : "";
      if (
        msg.includes("correspondingUseElement") ||
        msg.includes("nodeType") ||
        msg.includes("Permission denied to access property") ||
        msg.includes("googletagmanager") ||
        msg.includes("cloudflareinsights") ||
        msg.includes("ERR_BLOCKED_BY_CLIENT")
      ) {
        e.stopImmediatePropagation?.();
        e.preventDefault?.();
      }
    }

    function handleRejection(e: PromiseRejectionEvent) {
      const msg = e?.reason?.message || String(e?.reason ?? "");
      if (
        msg.includes("correspondingUseElement") ||
        msg.includes("nodeType") ||
        msg.includes("Permission denied to access property") ||
        msg.includes("googletagmanager") ||
        msg.includes("cloudflareinsights") ||
        msg.includes("ERR_BLOCKED_BY_CLIENT")
      ) {
        e.stopImmediatePropagation?.();
        e.preventDefault?.();
      }
    }

    // Intercept and filter benign third-party console errors
    const originalConsoleError = console.error;
    console.error = function (...args: unknown[]) {
      const text = args
        .map((a) => (typeof a === "string" ? a : a instanceof Error ? a.message : ""))
        .join(" ");
      if (
        text.includes("correspondingUseElement") ||
        text.includes("nodeType") ||
        text.includes("Permission denied") ||
        text.includes("googletagmanager") ||
        text.includes("google-analytics") ||
        text.includes("cloudflareinsights") ||
        text.includes("ERR_BLOCKED_BY_CLIENT")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection, true);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection, true);
    };
  }, []);

  return null;
}
