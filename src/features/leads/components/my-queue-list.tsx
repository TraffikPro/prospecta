import NextLink from "next/link";
import { Card, Heading, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { LeadPriorityBadge } from "@/features/leads/components/lead-priority-badge";
import {
  formatCampaignLabel,
  type MyQueueView,
} from "@/features/leads/my-queue";

type MyQueueListProps = {
  view: MyQueueView;
};

export function MyQueueList({ view }: MyQueueListProps) {
  if (view.items.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" data-testid="my-queue-empty">
        {view.summary.total === 0
          ? "Nenhum lead ativo na sua fila. Leads WON/LOST ficam de fora."
          : "Nenhum lead neste filtro."}
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
            {section.items.map((item) => (
              <Card.Root
                key={item.id}
                variant="outline"
                borderRadius="card"
                data-testid="my-queue-card"
                data-lead-id={item.id}
              >
                <Card.Body>
                  <Stack
                    direction={{ base: "column", sm: "row" }}
                    justify="space-between"
                    align={{ base: "stretch", sm: "flex-start" }}
                    gap="4"
                  >
                    <Stack gap="2" minW="0" flex="1">
                      <Text fontWeight="semibold" truncate fontSize="lg">
                        {item.companyName}
                      </Text>
                      <LeadPriorityBadge
                        qualification={item.qualification}
                        score={item.score}
                      />
                      <Stack gap="0.5">
                        <Text fontSize="sm" fontWeight="medium">
                          Próxima ação: {item.nextAction.actionLabel}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          Status: {item.nextAction.statusLabel}
                        </Text>
                        {item.campaign ? (
                          <Text fontSize="sm" color="fg.muted">
                            Campanha: {formatCampaignLabel(item.campaign)}
                          </Text>
                        ) : null}
                      </Stack>
                    </Stack>
                    <Stack
                      direction={{ base: "column", sm: "row" }}
                      gap="2"
                      alignSelf={{ base: "stretch", sm: "center" }}
                    >
                      <Button
                        asChild
                        size="sm"
                        alignSelf={{ base: "stretch", sm: "center" }}
                      >
                        <NextLink
                          href={`/app/leads/${item.id}#register-activity`}
                        >
                          Registrar contato
                        </NextLink>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        colorPalette="gray"
                        alignSelf={{ base: "stretch", sm: "center" }}
                      >
                        <NextLink href={`/app/leads/${item.id}`}>
                          Abrir
                        </NextLink>
                      </Button>
                    </Stack>
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
