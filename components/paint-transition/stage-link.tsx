"use client";

import Link, { type LinkProps } from "next/link";
import { useStageTransition } from "./stage-transition-provider";

export interface StageLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    LinkProps {
  children: React.ReactNode;
}

/**
 * StageLink provides an organic paint splatter cover animation before navigating,
 * followed by a tearing/ripping hole intro reveal on the destination page.
 */
export function StageLink({ href, onClick, children, ...props }: StageLinkProps) {
  const { navigateTo } = useStageTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if link should open normally (new tab, modifier keys, external)
    const targetHref = typeof href === "string" ? href : href.pathname ?? "/";
    const isExternal =
      targetHref.startsWith("http://") ||
      targetHref.startsWith("https://") ||
      targetHref.startsWith("//") ||
      targetHref.startsWith("mailto:") ||
      targetHref.startsWith("tel:") ||
      props.target === "_blank";

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || isExternal) {
      onClick?.(e);
      return;
    }

    e.preventDefault();
    onClick?.(e);
    const originCoords = {
      x: e.clientX,
      y: e.clientY,
    };
    navigateTo(targetHref, originCoords);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}

export { StageLink as Link };
