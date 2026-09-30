import NextLink from "next/link";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import { buildLeadDetailHref } from "@/components/navigation";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { leadStageLabels, qualificationLabels } from "@/features/leads/lead.labels";
import {
  MY_QUEUE_EMPTY_BY_FILTER,
  filterForBucket,
  myQueueHref,
  type MyQueueBucket,
  type MyQueueItem,
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

function urgencyAccent(bucket: MyQueueBucket): string | undefined {
  if (bucket === "overdue") return "danger.solid";
  if (bucket === "due_today") return "warning.solid";
  return undefined;
}

function scoreLabel(item: MyQueueItem): string | null {
  if (typeof item.score === "number" && item.qualification) {
    return `${item.score} · ${qualificationLabels[item.qualification]}`;
  }
  if (typeof item.score === "number") {
    return String(item.score);
  }
  if (item.qualification) {
    return qualificationLabels[item.qualification];
  }
  return null;
}

function QueueRow({
  item,
  filter,
}: {
  item: MyQueueItem;
  filter: MyQueueView["filter"];
}) {
  const accent = urgencyAccent(item.bucket);
  const score = scoreLabel(item);
  const openHref = leadHref(item.id, filter);
  const registerHref = leadHref(item.id, filter, "register-activity");

  return (
    <Box
      as="article"
      data-testid="my-queue-row"
      data-lead-id={item.id}
      data-bucket={item.bucket}
      borderWidth="1px"
      borderColor={
        item.bucket === "overdue"
          ? "danger.emphasized"
          : item.bucket === "due_today"
            ? "warning.emphasized"
            : "border"
      }
      borderRadius="surface"
      bg="bg"
      overflow="hidden"
      _hover={{ bg: "bg.subtle" }}
    >
      <HStack align="stretch" gap="0" minH="touch">
        {accent ? (
          <Box
            w="1"
            flexShrink={0}
            bg={accent}
            aria-hidden
            data-testid="my-queue-urgency-accent"
          />
        ) : null}
        <Stack
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={{ base: "3", md: "4" }}
          px={{ base: "3", md: "4" }}
          py={{ base: "3", md: "2.5" }}
          flex="1"
          minW="0"
        >
          <Box flex="1" minW="0">
            <NextLink
              href={openHref}
              data-testid="my-queue-row-link"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <Stack gap="1" minW="0">
                <HStack gap="2" flexWrap="wrap" align="baseline">
                  <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                    {item.companyName}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {leadStageLabels[item.stage]}
                  </Text>
                  {score ? (
                    <Text fontSize="xs" color="fg.muted" whiteSpace="nowrap">
                      {score}
                    </Text>
                  ) : null}
                </HStack>
                <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                  {item.nextAction.actionLabel}
                </Text>
                <HStack gap="3" flexWrap="wrap" fontSize="xs" color="fg.muted">
                  <Text as="span">{item.nextAction.statusLabel}</Text>
                  <Text as="span">
                    Follow-up: {formatFollowUp(item.nextAction.followUpAt)}
                  </Text>
                </HStack>
              </Stack>
            </NextLink>
          </Box>

          <HStack
            gap="2"
            flexShrink={0}
            alignSelf={{ base: "stretch", md: "center" }}
            justify={{ base: "stretch", md: "flex-end" }}
          >
            <Button
              asChild
              size="sm"
              minH="touch"
              flex={{ base: "1", md: "none" }}
              variant="outline"
              colorPalette="gray"
            >
              <NextLink href={registerHref}>Registrar</NextLink>
            </Button>
            <Button
              asChild
              size="sm"
              minH="touch"
              flex={{ base: "1", md: "none" }}
            >
              <NextLink href={openHref}>Abrir</NextLink>
            </Button>
          </HStack>
        </Stack>
      </HStack>
    </Box>
  );
}

export function MyQueueList({ view }: MyQueueListProps) {
  if (view.items.length === 0) {
    const isAllEmpty = view.summary.total === 0;
    const title = isAllEmpty
      ? MY_QUEUE_EMPTY_BY_FILTER.all
      : MY_QUEUE_EMPTY_BY_FILTER[view.filter];

    return (
      <AppEmptyState
        data-testid="my-queue-empty"
        title={title}
        description={
          isAllEmpty
            ? "Cadastre um lead ou complete a carteira quando houver vagas."
            : "Troque o filtro ou volte para Todos para ver o restante da fila."
        }
        action={
          isAllEmpty ? (
            <Button asChild size="md" minH="touch" width={{ base: "full", sm: "auto" }}>
              <NextLink href="/app/leads/new">Cadastrar lead</NextLink>
            </Button>
          ) : view.filter !== "all" ? (
            <Button
              asChild
              size="md"
              minH="touch"
              variant="outline"
              colorPalette="gray"
              width={{ base: "full", sm: "auto" }}
            >
              <NextLink href="/app/my-leads">Ver todos</NextLink>
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <Stack gap="6" data-testid="my-queue-list">
      {view.sections.map((section) => (
        <Stack
          key={section.bucket}
          gap="2"
          as="section"
          aria-labelledby={`queue-${section.bucket}`}
          data-testid={`my-queue-section-${section.bucket}`}
          data-total-count={section.totalCount}
          data-truncated={section.truncated ? "true" : "false"}
        >
          <Heading
            as="h2"
            id={`queue-${section.bucket}`}
            textStyle="sectionTitle"
          >
            {section.title}{" "}
            <Text as="span" fontWeight="normal" color="fg.muted">
              ({section.totalCount})
            </Text>
          </Heading>
          <Stack gap="2">
            {section.items.map((item) => (
              <QueueRow key={item.id} item={item} filter={view.filter} />
            ))}
          </Stack>
          {section.truncated ? (
            <TruncationHint
              bucket={section.bucket}
              shown={section.items.length}
              total={section.totalCount}
            />
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}

function TruncationHint({
  bucket,
  shown,
  total,
}: {
  bucket: MyQueueBucket;
  shown: number;
  total: number;
}) {
  const filter = filterForBucket(bucket);
  const remaining = total - shown;
  if (filter) {
    return (
      <Button
        asChild
        size="md"
        minH="touch"
        variant="outline"
        colorPalette="gray"
        alignSelf="start"
        data-testid={`my-queue-section-more-${bucket}`}
      >
        <NextLink href={myQueueHref({ filter })}>
          Ver todos ({total}) · +{remaining} não exibidos
        </NextLink>
      </Button>
    );
  }

  return (
    <Text
      fontSize="sm"
      color="fg.muted"
      data-testid={`my-queue-section-more-${bucket}`}
    >
      Exibindo {shown} de {total} (menor urgência). Use os filtros acima para
      fatiar a fila.
    </Text>
  );
}
