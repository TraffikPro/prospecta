import type { AnalysisResponse } from "@/server/lead-ai-analysis/service";

const messages: Record<string, string> = {
  AI_ANALYSIS_DISABLED: "A análise ainda não está disponível.",
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente para continuar.",
  FORBIDDEN: "Você não tem mais acesso à análise deste lead.",
  VALIDATION: "Não foi possível identificar esta solicitação. Atualize a página.",
  PROVIDER_NOT_CONFIGURED: "A análise ainda está em preparação. Tente novamente mais tarde.",
  CONFLICT: "Já existe uma solicitação em andamento. Atualize o resultado.",
  STALE_RUN: "Esta tentativa expirou. Você pode iniciar uma nova análise.",
  RATE_LIMITED: "Você atingiu o limite de análises. Tente novamente mais tarde.",
  INTERNAL: "Não foi possível concluir a solicitação. Tente novamente.",
};
export function analysisError(response: AnalysisResponse): string | null {
  return response.ok ? null : messages[response.code] ?? messages.INTERNAL;
}
export function isAnalysisBlocked(response: AnalysisResponse): boolean {
  return !response.ok && ["AI_ANALYSIS_DISABLED", "UNAUTHENTICATED", "FORBIDDEN", "VALIDATION", "PROVIDER_NOT_CONFIGURED"].includes(response.code);
}
export function evidenceHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
export function analysisDate(raw: string): string {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "Data não disponível" : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
  }).format(date);
}
