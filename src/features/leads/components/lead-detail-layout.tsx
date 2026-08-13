"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { Box, Stack } from "@chakra-ui/react";

/** Offset below viewport top — desktop shell is a sidebar, no sticky header. */
const STICKY_TOP_PX = 24;
/** Matches desktop rail stack gap token `1` (0.25rem). */
const GAP_PX = 4;

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
 * Desktop rail shares one grid cell (stacked) so main-column row tracks do not
 * insert gaps between Next / Contact / Stage. Sticky when the group fits.
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

  useLayoutEffect(() => {
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

      // Same grid cell on desktop: stack with marginTop so main row tracks
      // cannot stretch gaps between rail blocks.
      const contactOffset = nextH + GAP_PX;
      const stageOffset = nextH + GAP_PX + contactH + GAP_PX;

      if (!canStick) {
        setRailSticky({
          canStick: false,
          next: { position: "relative" },
          contact: { position: "relative", marginTop: contactOffset },
          stage: { position: "relative", marginTop: stageOffset },
        });
        return;
      }

      setRailSticky({
        canStick: true,
        next: { position: "sticky", top: STICKY_TOP_PX },
        contact: {
          position: "sticky",
          top: STICKY_TOP_PX + contactOffset,
          marginTop: contactOffset,
        },
        stage: {
          position: "sticky",
          top: STICKY_TOP_PX + stageOffset,
          marginTop: stageOffset,
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
      columnGap={{ base: "6", lg: "6" }}
      rowGap={{ base: "3", lg: "6" }}
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
          "main rail"
          "origin origin"
        `,
      }}
      data-testid="lead-detail-layout"
      data-sticky={railSticky.canStick ? "true" : "false"}
    >
      <Box
        ref={nextRef}
        gridArea={{ base: "next", lg: "rail" }}
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
        gridArea={{ base: "contact", lg: "rail" }}
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
        gridArea={{ base: "stage", lg: "rail" }}
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
