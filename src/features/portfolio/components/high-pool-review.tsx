import NextLink from "next/link";
import { Card, Heading, Stack, Text } from "@chakra-ui/react";

import { LeadStageBadge } from "@/features/leads/components/lead-stage-badge";
import type { HighPoolReview, HighPoolReviewItem } from "@/server/services/portfolio.service";

import { RecycleLeadButton } from "./recycle-lead-button";

type HighPoolReviewBoardProps = {
  review: HighPoolReview;
};

const SECTIONS: Array<{
  key: keyof HighPoolReview;
  title: string;
  empty: string;
  hint?: string;
  testId: string;
  recycle?: boolean;
}> = [
  {
    key: "eligible",
    title: "Elegíveis",
    empty: "Nenhum HIGH elegível no pool.",
    hint: "Atribua pelo detalhe do lead. Tratado não aparece aqui até a reciclagem.",
    testId: "high-pool-eligible",
  },
  {
    key: "assigned",
    title: "Atribuídos",
    empty: "Nenhum HIGH com atribuição ativa.",
    testId: "high-pool-assigned",
  },
  {
    key: "recyclable",
    title: "Recicláveis",
    empty: "Nenhum HIGH tratado aguardando reciclagem.",
    hint: "Reciclar é ação explícita de administrador. Tratado não volta sozinho ao pool.",
    testId: "high-pool-recyclable",
    recycle: true,
  },
  {
    key: "capped",
    title: "Encerrados",
    empty: "Nenhum lead atingiu o limite de 2 ciclos.",
    testId: "high-pool-capped",
  },
];

function LeadRow({
  item,
  recycle,
}: {
  item: HighPoolReviewItem;
  recycle?: boolean;
}) {
  return (
    <Card.Root variant="outline" borderRadius="card">
      <Card.Body>
        <Stack
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          gap="3"
          align={{ sm: "center" }}
        >
          <Stack gap="1" minW="0">
            <Heading as="h3" size="sm" fontWeight="semibold" truncate>
              <NextLink href={`/app/leads/${item.id}`}>{item.companyName}</NextLink>
            </Heading>
            <Stack direction="row" gap="2" flexWrap="wrap" align="center">
              <LeadStageBadge stage={item.stage} />
              <Text fontSize="sm" color="fg.muted">
                Ciclos {item.cycles}/2
              </Text>
              {item.operatorName ? (
                <Text fontSize="sm" color="fg.muted">
                  {item.operatorName}
                </Text>
              ) : null}
            </Stack>
          </Stack>
          {recycle ? <RecycleLeadButton leadId={item.id} /> : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

export function HighPoolReviewBoard({ review }: HighPoolReviewBoardProps) {
  return (
    <Stack gap="8">
      {SECTIONS.map((section) => {
        const items = review[section.key];
        return (
          <Stack key={section.key} gap="3" data-testid={section.testId}>
            <Stack gap="1">
              <Heading as="h2" size="md">
                {section.title}
              </Heading>
              {section.hint ? (
                <Text fontSize="sm" color="fg.muted">
                  {section.hint}
                </Text>
              ) : null}
            </Stack>
            {items.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {section.empty}
              </Text>
            ) : (
              <Stack gap="3">
                {items.map((item) => (
                  <LeadRow
                    key={item.id}
                    item={item}
                    recycle={section.recycle}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
