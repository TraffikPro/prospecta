import { Badge, Card, Stack, Text } from "@chakra-ui/react";

import { acquisitionJobStatusLabels } from "@/features/acquisition/acquisition.labels";
import { isAcquisitionJobTimedOut } from "@/server/services/acquisition-job.service";
import type { AcquisitionJobWithRequester } from "@/server/repositories/acquisition-job.repository";

type AcquisitionJobsTableProps = {
  jobs: AcquisitionJobWithRequester[];
};

function formatWhen(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function statusPalette(
  status: AcquisitionJobWithRequester["status"],
): "gray" | "blue" | "green" | "red" {
  switch (status) {
    case "QUEUED":
      return "gray";
    case "RUNNING":
      return "blue";
    case "SUCCEEDED":
      return "green";
    case "FAILED":
      return "red";
    default:
      return "gray";
  }
}

export function AcquisitionJobsTable({ jobs }: AcquisitionJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" data-testid="acquisition-jobs-empty">
        Nenhuma aquisição solicitada ainda.
      </Text>
    );
  }

  return (
    <Stack gap="3" data-testid="acquisition-jobs">
      {jobs.map((job) => {
        const timedOut = isAcquisitionJobTimedOut(job);
        return (
          <Card.Root key={job.id} variant="outline" borderRadius="card">
            <Card.Body>
              <Stack gap="2">
                <Stack
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                  gap="2"
                  align={{ sm: "center" }}
                >
                  <Text fontWeight="semibold">
                    {job.query} · {job.city}
                  </Text>
                  <Badge colorPalette={statusPalette(job.status)}>
                    {acquisitionJobStatusLabels[job.status]}
                    {timedOut ? " (timeout)" : ""}
                  </Badge>
                </Stack>

                <Text fontSize="sm" color="fg.muted">
                  Campanha <Text as="span" fontFamily="mono">{job.campaign}</Text>
                  {" · "}
                  limite {job.limit}
                  {" · "}
                  {formatWhen(job.requestedAt)}
                  {" · "}
                  {job.requestedBy.name}
                </Text>

                {job.status === "SUCCEEDED" || job.status === "RUNNING" ? (
                  <Text fontSize="sm">
                    Encontrados: {job.foundCount ?? "—"} · Qualificados:{" "}
                    {job.qualifiedCount ?? "—"} · Criados:{" "}
                    {job.createdTotal ?? "—"} (HIGH {job.createdHigh ?? "—"}) ·
                    Existentes: {job.existingCount ?? "—"} · Falhas:{" "}
                    {job.failedCount ?? "—"}
                  </Text>
                ) : null}

                {job.errorMessage ? (
                  <Text fontSize="sm" color="fg.error" role="status">
                    {job.errorMessage}
                  </Text>
                ) : null}
              </Stack>
            </Card.Body>
          </Card.Root>
        );
      })}
    </Stack>
  );
}
