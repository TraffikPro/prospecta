"use client";

import { useState, useEffect } from "react";

/** Synthetic fixture: Rules of Hooks + exhaustive-deps infractions. */
export function BadHooksFixture() {
  if (Math.random() > 0.5) {
    // eslint should flag: conditional hook
    const [x] = useState(0);
    return <span>{x}</span>;
  }

  useEffect(() => {
    console.log("missing deps");
  }, []);

  const unused = useState(1);
  return <button onClick={() => unused[1](2)}>ok</button>;
}
