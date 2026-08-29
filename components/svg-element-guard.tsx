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
        msg.includes("Permission denied to access property")
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
        msg.includes("Permission denied to access property")
      ) {
        e.stopImmediatePropagation?.();
        e.preventDefault?.();
      }
    }

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection, true);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection, true);
    };
  }, []);

  return null;
}
