import { AppEmptyState } from "@/components/ui/app-empty-state";

export function DashboardLoadError() {
  return (
    <AppEmptyState
      title="Não foi possível carregar os indicadores desta semana."
      description="Tente novamente em instantes. A operação na Minha fila continua disponível."
      data-testid="dashboard-load-error"
    />
  );
}
