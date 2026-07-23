export class AuthenticationError extends Error {
  readonly code = "UNAUTHENTICATED" as const;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN" as const;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const INVALID_CREDENTIALS_MESSAGE = "Credenciais inválidas.";
