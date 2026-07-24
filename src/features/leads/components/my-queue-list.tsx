import NextLink from "next/link";
import { Card, Heading, Stack, Text } from "@chakra-ui/react";

import { buildLeadDetailHref } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { LeadPriorityBadge } from "@/features/leads/components/lead-priority-badge";
import {
  MY_QUEUE_EMPTY_BY_FILTER,
  type MyQueueView,
} from "@/features/leads/my-queue";

type MyQueueListProps = {
  view: MyQueueView;
};

function formatFollowUp(value: Date | null): string {
  if (!value) {
    return "Sem follow-up";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function leadHref(leadId: string, filter: MyQueueView["filter"], hash?: string) {
  const base = buildLeadDetailHref(leadId, "my-leads", filter);
  return hash ? `${base}#${hash}` : base;
}

export function MyQueueList({ view }: MyQueueListProps) {
  if (view.items.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" data-testid="my-queue-empty">
        {view.summary.total === 0
          ? MY_QUEUE_EMPTY_BY_FILTER.all
          : MY_QUEUE_EMPTY_BY_FILTER[view.filter]}
      </Text>
    );
  }

  return (
    <Stack gap="8" data-testid="my-queue-list">
      {view.sections.map((section) => (
        <Stack
          key={section.bucket}
          gap="3"
          as="section"
          aria-labelledby={`queue-${section.bucket}`}
          data-testid={`my-queue-section-${section.bucket}`}
        >
          <Heading as="h2" size="md" id={`queue-${section.bucket}`}>
            {section.title}{" "}
            <Text as="span" fontWeight="normal" color="fg.muted">
              ({section.items.length})
            </Text>
          </Heading>
          <Stack gap="3">
            {section.items.map((item) => {
              const highlight =
                item.bucket === "overdue"
                  ? "danger"
                  : item.bucket === "due_today"
                    ? "warning"
                    : null;

              return (
                <Card.Root
                  key={item.id}
                  variant="outline"
                  borderRadius="card"
                  borderColor={
                    highlight === "danger"
                      ? "danger.emphasized"
                      : highlight === "warning"
                        ? "warning.emphasized"
                        : undefined
                  }
                  bg={
                    highlight === "danger"
                      ? "danger.subtle"
                      : highlight === "warning"
                        ? "warning.subtle"
                        : undefined
                  }
                  data-testid="my-queue-card"
                  data-lead-id={item.id}
                  data-bucket={item.bucket}
                  transition="background 0.15s ease, border-color 0.15s ease"
                  _active={{ bg: "bg.muted" }}
                >
                  <Card.Body>
                    <Stack gap="4">
                      <NextLink
                        href={leadHref(item.id, view.filter)}
                        style={{ textDecoration: "none", color: "inherit" }}
                        data-testid="my-queue-card-link"
                      >
                        <Stack gap="2" minW="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item.companyName}
                          </Text>
                          <LeadPriorityBadge
                            qualification={item.qualification}
                            score={item.score}
                          />
                          <Text fontSize="sm" fontWeight="medium">
                            {item.nextAction.actionLabel}
                          </Text>
                          <Text fontSize="sm" color="fg.muted">
                            {item.nextAction.statusLabel}
                          </Text>
                          <Text fontSize="sm" color="fg.muted">
                            Follow-up: {formatFollowUp(item.nextAction.followUpAt)}
                          </Text>
                        </Stack>
                      </NextLink>

                      <Stack
                        direction={{ base: "column", sm: "row" }}
                        gap="2"
                        alignSelf="stretch"
                      >
                        <Button
                          asChild
                          size="md"
                          minH="11"
                          width={{ base: "full", sm: "auto" }}
                        >
                          <NextLink href={leadHref(item.id, view.filter)}>
                            Abrir lead
                          </NextLink>
                        </Button>
                        <Button
                          asChild
                          size="md"
                          minH="11"
                          variant="outline"
                          colorPalette="gray"
                          width={{ base: "full", sm: "auto" }}
                        >
                          <NextLink
                            href={leadHref(
                              item.id,
                              view.filter,
                              "register-activity",
                            )}
                          >
                            Registrar contato
                          </NextLink>
                        </Button>
                      </Stack>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              );
            })}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
