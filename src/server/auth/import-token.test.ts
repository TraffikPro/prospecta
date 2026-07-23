import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { authorizeImportRequest } from "./import-token";

describe("authorizeImportRequest", () => {
  const previous = process.env.PROSPECTA_IMPORT_TOKEN;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.PROSPECTA_IMPORT_TOKEN;
    } else {
      process.env.PROSPECTA_IMPORT_TOKEN = previous;
    }
  });

  it("accepts matching Bearer token", () => {
    process.env.PROSPECTA_IMPORT_TOKEN = "test-import-token-123";
    const request = new Request("http://localhost/api/internal/leads", {
      headers: { Authorization: "Bearer test-import-token-123" },
    });
    assert.equal(authorizeImportRequest(request), true);
  });

  it("rejects missing or wrong token", () => {
    process.env.PROSPECTA_IMPORT_TOKEN = "test-import-token-123";
    assert.equal(
      authorizeImportRequest(new Request("http://localhost/api/internal/leads")),
      false,
    );
    assert.equal(
      authorizeImportRequest(
        new Request("http://localhost/api/internal/leads", {
          headers: { Authorization: "Bearer wrong" },
        }),
      ),
      false,
    );
  });

  it("rejects when env token is unset", () => {
    delete process.env.PROSPECTA_IMPORT_TOKEN;
    const request = new Request("http://localhost/api/internal/leads", {
      headers: { Authorization: "Bearer anything" },
    });
    assert.equal(authorizeImportRequest(request), false);
  });
});
