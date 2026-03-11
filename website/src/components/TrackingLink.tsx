"use client";

import Link from "next/link";
import { trackEvent } from "../lib/analytics";
import type { ComponentProps } from "react";

type TrackingLinkProps = ComponentProps<typeof Link> & {
  /** GA4 event name to fire on click */
  event?: string;
};

export default function TrackingLink({
  event,
  onClick,
  ...props
}: TrackingLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (event) {
      trackEvent(event);
    }
    if (typeof onClick === "function") {
      (onClick as (e: React.MouseEvent<HTMLAnchorElement>) => void)(e);
    }
  };

  return <Link {...props} onClick={handleClick} />;
}
