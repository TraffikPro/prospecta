export const LOGIN_PATH = "/login";

export const LOGIN_REASON_SESSION_EXPIRED = "session_expired" as const;

export type LoginReason = typeof LOGIN_REASON_SESSION_EXPIRED;

export const SESSION_EXPIRED_MESSAGE =
  "Sua sessão expirou. Entre novamente para continuar.";

export const FORGOT_PASSWORD_ACK_MESSAGE =
  "Se este email estiver cadastrado, enviaremos instruções.";

export const PASSWORD_CHANGED_MESSAGE =
  "Senha alterada. Faça login novamente.";

export const CHANGE_PASSWORD_PATH = "/change-password";
export const APP_HOME_PATH = "/app";

export const MUST_CHANGE_PASSWORD_MESSAGE =
  "Você precisa alterar sua senha para continuar.";

export function loginPath(reason?: LoginReason): string {
  if (reason === LOGIN_REASON_SESSION_EXPIRED) {
    return `${LOGIN_PATH}?reason=${LOGIN_REASON_SESSION_EXPIRED}`;
  }
  return LOGIN_PATH;
}

export function postAuthPath(user: { mustChangePassword: boolean }): string {
  return user.mustChangePassword ? CHANGE_PASSWORD_PATH : APP_HOME_PATH;
}

export function isSessionExpiredReason(
  reason: string | undefined,
): reason is LoginReason {
  return reason === LOGIN_REASON_SESSION_EXPIRED;
}
