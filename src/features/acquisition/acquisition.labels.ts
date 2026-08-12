import type { AcquisitionJobStatus } from "@prisma/client";

export const acquisitionJobStatusLabels: Record<AcquisitionJobStatus, string> =
  {
    QUEUED: "Na fila",
    RUNNING: "Em execução",
    SUCCEEDED: "Concluído",
    FAILED: "Falhou",
  };
