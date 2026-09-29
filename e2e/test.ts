import { test as base } from "@playwright/test";

import { ensureE2ERateLimitScope } from "./helpers";

export const test = base.extend<{ e2eRateLimitScope: void }>({
  e2eRateLimitScope: [
    async ({ page }, use) => {
      await ensureE2ERateLimitScope(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
