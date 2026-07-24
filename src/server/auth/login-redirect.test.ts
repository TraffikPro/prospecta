import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FORGOT_PASSWORD_ACK_MESSAGE,
  isSessionExpiredReason,
  loginPath,
  MUST_CHANGE_PASSWORD_MESSAGE,
  PASSWORD_CHANGED_MESSAGE,
  postAuthPath,
  SESSION_EXPIRED_MESSAGE,
} from "./login-redirect";

describe("login redirect helpers", () => {
  it("builds plain login path by default", () => {
    assert.equal(loginPath(), "/login");
  });

  it("builds session-expired login path", () => {
    assert.equal(loginPath("session_expired"), "/login?reason=session_expired");
  });

  it("recognizes session_expired reason", () => {
    assert.equal(isSessionExpiredReason("session_expired"), true);
    assert.equal(isSessionExpiredReason(undefined), false);
    assert.equal(isSessionExpiredReason("other"), false);
  });

  it("keeps stable operator-facing copy", () => {
    assert.equal(
      SESSION_EXPIRED_MESSAGE,
      "Sua sessão expirou. Entre novamente para continuar.",
    );
    assert.equal(
      FORGOT_PASSWORD_ACK_MESSAGE,
      "Se este email estiver cadastrado, enviaremos instruções.",
    );
    assert.equal(
      PASSWORD_CHANGED_MESSAGE,
      "Senha alterada. Faça login novamente.",
    );
    assert.equal(
      MUST_CHANGE_PASSWORD_MESSAGE,
      "Você precisa alterar sua senha para continuar.",
    );
  });

  it("routes first-access users to change-password", () => {
    assert.equal(postAuthPath({ mustChangePassword: true }), "/change-password");
    assert.equal(postAuthPath({ mustChangePassword: false }), "/app");
  });
});

