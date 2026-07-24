import NextLink from "next/link";
import { Card, Heading, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import type { MyQueueView } from "@/features/leads/my-queue";

type MyQueueListProps = {
  view: MyQueueView;
};

export function MyQueueList({ view }: MyQueueListProps) {
  if (view.summary.total === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" data-testid="my-queue-empty">
        Nenhum lead ativo na sua fila. Leads WON/LOST ficam de fora.
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
                    align={{ base: "stretch", sm: "center" }}
                    gap="3"
                  >
                    <Stack gap="1" minW="0">
                      <Text fontWeight="semibold" truncate>
                        {item.companyName}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        {typeof item.score === "number"
                          ? `Score ${item.score}`
                          : "Sem score"}
                        {" · "}
                        {item.nextAction.statusLabel}
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        Ação: {item.nextAction.actionLabel}
                      </Text>
                    </Stack>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      colorPalette="gray"
                      alignSelf={{ base: "flex-start", sm: "center" }}
                    >
                      <NextLink href={`/app/leads/${item.id}`}>Abrir</NextLink>
                    </Button>
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
