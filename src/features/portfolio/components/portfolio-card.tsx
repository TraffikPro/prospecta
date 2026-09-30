import { Card, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

import {
  DEMO_COPY_LABEL,
  DEMO_OPEN_LABEL,
  summarizeDemoFeatures,
} from "../demo-presentation";
import { portfolioNicheLabels } from "../portfolio.labels";
import type { PortfolioModel } from "../portfolio.schema";
import { CopyLinkButton } from "./copy-link-button";
import { PortfolioCover } from "./portfolio-cover";

type PortfolioCardProps = {
  model: PortfolioModel;
};

function formatFeatureLine(
  features: readonly string[],
): string {
  const { visible, overflow } = summarizeDemoFeatures(features);
  const base = visible.join(" · ");
  return overflow > 0 ? `${base} · +${overflow}` : base;
}

/**
 * Demo showcase tile — visual preview + factual identity + open/copy actions.
 * Disclaimer lives on the page (not repeated per card).
 */
export function PortfolioCard({ model }: PortfolioCardProps) {
  return (
    <Card.Root
      variant="outline"
      borderRadius="surface"
      overflow="hidden"
      bg="bg"
      h="full"
      transition="border-color 0.15s ease"
      _hover={{ borderColor: "border.emphasized" }}
      data-testid="portfolio-card"
      data-model-id={model.id}
    >
      <PortfolioCover model={model} />
      <Card.Body py="4" px="4">
        <Stack gap="3" h="full">
          <Stack gap="1" flex="1">
            <Heading as="h2" textStyle="sectionTitle">
              {model.title}
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Nicho: {portfolioNicheLabels[model.niche]}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="medium"
              color="fg.muted"
              data-testid="portfolio-demo-label"
            >
              Modelo demonstrativo · DevFlow Labs
            </Text>
            <Text textStyle="body" mt="1">
              {model.description}
            </Text>
            <Text
              fontSize="xs"
              color="fg.muted"
              mt="1"
              data-testid="portfolio-feature-line"
            >
              {formatFeatureLine(model.features)}
            </Text>
          </Stack>

          <HStack
            gap="2"
            align="stretch"
            flexWrap={{ base: "wrap", sm: "nowrap" }}
            pt="1"
          >
            <Button asChild size="md" minH="touch" flex="1">
              <a
                href={model.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="portfolio-open-demo"
              >
                {DEMO_OPEN_LABEL}
              </a>
            </Button>
            <CopyLinkButton url={model.previewUrl} label={DEMO_COPY_LABEL} />
          </HStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
