import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { authorizeCronRequest } from "./cron-secret";

describe("authorizeCronRequest", () => {
  const previous = process.env.CRON_SECRET;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  });

  it("accepts matching Bearer token", () => {
    process.env.CRON_SECRET = "test-cron-secret-123456";
    const request = new Request(
      "http://localhost/api/cron/weekly-portfolio-close",
      { headers: { Authorization: "Bearer test-cron-secret-123456" } },
    );
    assert.equal(authorizeCronRequest(request), true);
  });

  it("rejects missing or wrong token", () => {
    process.env.CRON_SECRET = "test-cron-secret-123456";
    assert.equal(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/weekly-portfolio-close"),
      ),
      false,
    );
    assert.equal(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/weekly-portfolio-close", {
          headers: { Authorization: "Bearer wrong" },
        }),
      ),
      false,
    );
  });

  it("rejects when env token is unset", () => {
    delete process.env.CRON_SECRET;
    const request = new Request(
      "http://localhost/api/cron/weekly-portfolio-close",
      { headers: { Authorization: "Bearer anything" } },
    );
    assert.equal(authorizeCronRequest(request), false);
  });
});
