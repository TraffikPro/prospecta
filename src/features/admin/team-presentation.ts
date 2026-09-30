/**
 * Presentation helpers for Equipe — no business rules.
 */

export function formatOpenOwnedLeads(count: number): string {
  if (count === 0) return "Nenhum lead aberto";
  if (count === 1) return "1 lead aberto";
  return `${count} leads abertos`;
}

export function formatTeamMemberCount(count: number): string {
  if (count === 1) return "1 membro";
  return `${count} membros`;
}
