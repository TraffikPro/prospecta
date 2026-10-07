"use client";

import { useEffect, useState } from "react";

/** Synthetic: exhaustive-deps should warn when enabled (severity 1). */
export function MissingDepsFixture() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(n + 1);
  }, []);
  return <span>{n}</span>;
}
