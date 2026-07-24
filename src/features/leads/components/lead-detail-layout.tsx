"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { Box, Stack } from "@chakra-ui/react";

/** Offset below sticky AppShell header (logo + desktop nav) — ~5.5rem. */
const STICKY_TOP_PX = 88;
const GAP_PX = 24;

type LeadDetailLayoutProps = {
  nextAction: ReactNode;
  contact: ReactNode;
  intelligence: ReactNode;
  activity: ReactNode;
  history: ReactNode;
  stage: ReactNode;
  origin: ReactNode;
};

type RailStickyStyles = {
  canStick: boolean;
  next: CSSProperties;
  contact: CSSProperties;
  stage: CSSProperties;
};

const STATIC_RAIL: RailStickyStyles = {
  canStick: false,
  next: { position: "static" },
  contact: { position: "static" },
  stage: { position: "static" },
};

/**
 * Lead Detail Fatia A — desktop ~65/35 + mobile operational order.
 * Stable DOM (no breakpoint remount): keyboard order matches mobile visual order.
 * Rail items stick on desktop only when the stacked group fits the viewport.
 */
export function LeadDetailLayout({
  nextAction,
  contact,
  intelligence,
  activity,
  history,
  stage,
  origin,
}: LeadDetailLayoutProps) {
  const nextRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [railSticky, setRailSticky] = useState<RailStickyStyles>(STATIC_RAIL);

  useEffect(() => {
    const nextEl = nextRef.current;
    const contactEl = contactRef.current;
    const stageEl = stageRef.current;
    if (!nextEl || !contactEl || !stageEl) {
      return;
    }

    const measure = () => {
      const desktop = window.matchMedia("(min-width: 62em)").matches;
      if (!desktop) {
        setRailSticky(STATIC_RAIL);
        return;
      }

      const nextH = nextEl.offsetHeight;
      const contactH = contactEl.offsetHeight;
      const stageH = stageEl.offsetHeight;
      const groupH = nextH + contactH + stageH + GAP_PX * 2;
      const canStick = groupH + STICKY_TOP_PX <= window.innerHeight;

      if (!canStick) {
        setRailSticky(STATIC_RAIL);
        return;
      }

      setRailSticky({
        canStick: true,
        next: { position: "sticky", top: STICKY_TOP_PX },
        contact: {
          position: "sticky",
          top: STICKY_TOP_PX + nextH + GAP_PX,
        },
        stage: {
          position: "sticky",
          top: STICKY_TOP_PX + nextH + GAP_PX + contactH + GAP_PX,
        },
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nextEl);
    observer.observe(contactEl);
    observer.observe(stageEl);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <Box
      display="grid"
      w="full"
      alignItems="start"
      gap={{ base: "6", lg: "8" }}
      gridTemplateColumns={{
        base: "1fr",
        lg: "minmax(0, 1.65fr) minmax(0, 0.9fr)",
      }}
      gridTemplateAreas={{
        base: `
          "next"
          "contact"
          "main"
          "stage"
          "origin"
        `,
        lg: `
          "main next"
          "main contact"
          "main stage"
          "origin origin"
        `,
      }}
      data-testid="lead-detail-layout"
      data-sticky={railSticky.canStick ? "true" : "false"}
    >
      <Box
        ref={nextRef}
        gridArea="next"
        minW={0}
        style={railSticky.next}
        zIndex={{ lg: railSticky.canStick ? 2 : "auto" }}
        data-testid="lead-detail-operational-rail"
        data-sticky={railSticky.canStick ? "true" : "false"}
      >
        {nextAction}
      </Box>
      <Box
        ref={contactRef}
        gridArea="contact"
        minW={0}
        style={railSticky.contact}
        zIndex={{ lg: railSticky.canStick ? 2 : "auto" }}
      >
        {contact}
      </Box>
      <Stack gridArea="main" gap={{ base: "6", lg: "8" }} minW={0}>
        {intelligence}
        {activity}
        {history}
      </Stack>
      <Box
        ref={stageRef}
        gridArea="stage"
        minW={0}
        style={railSticky.stage}
        zIndex={{ lg: railSticky.canStick ? 2 : "auto" }}
      >
        {stage}
      </Box>
      <Box gridArea="origin" minW={0}>
        {origin}
      </Box>
    </Box>
  );
}
