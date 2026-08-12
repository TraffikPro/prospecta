import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { authorizeAcquisitionJobRequest } from "./acquisition-job-token";

describe("authorizeAcquisitionJobRequest", () => {
  const previous = process.env.ACQUISITION_JOB_TOKEN;

  after(() => {
    if (previous === undefined) {
      delete process.env.ACQUISITION_JOB_TOKEN;
    } else {
      process.env.ACQUISITION_JOB_TOKEN = previous;
    }
  });

  it("accepts matching bearer token", () => {
    process.env.ACQUISITION_JOB_TOKEN = "acq-token-test-123456";
    const ok = authorizeAcquisitionJobRequest(
      new Request("http://localhost", {
        headers: { Authorization: "Bearer acq-token-test-123456" },
      }),
    );
    assert.equal(ok, true);
  });

  it("rejects missing or wrong token", () => {
    process.env.ACQUISITION_JOB_TOKEN = "acq-token-test-123456";
    assert.equal(
      authorizeAcquisitionJobRequest(new Request("http://localhost")),
      false,
    );
    assert.equal(
      authorizeAcquisitionJobRequest(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer wrong" },
        }),
      ),
      false,
    );
  });

  it("rejects when env is empty", () => {
    delete process.env.ACQUISITION_JOB_TOKEN;
    assert.equal(
      authorizeAcquisitionJobRequest(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer anything" },
        }),
      ),
      false,
    );
  });
});
