import { NextResponse } from "next/server";

import type { RateLimitDecision } from "./enforcement";

export const TEMPORARY_UNAVAILABLE_MESSAGE =
  "Não foi possível concluir agora. Tente novamente em instantes.";

export function serverActionRateLimitMessage(
  decision: RateLimitDecision,
  limitedMessage = "Muitas tentativas. Aguarde e tente novamente.",
): string | null {
  if (decision.status === "allowed") return null;
  return decision.status === "limited"
    ? limitedMessage
    : TEMPORARY_UNAVAILABLE_MESSAGE;
}

export function routeHandlerRateLimitResponse(
  decision: RateLimitDecision,
): NextResponse | null {
  if (decision.status === "allowed") return null;

  if (decision.status === "limited") {
    return NextResponse.json(
      { error: "Too Many Requests" },
      {
        status: 429,
        headers: { "Retry-After": String(decision.retryAfterSeconds) },
      },
    );
  }

  return NextResponse.json(
    { error: "Service Unavailable" },
    { status: 503, headers: { "Retry-After": "1" } },
  );
}
