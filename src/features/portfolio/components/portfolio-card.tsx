import { Card, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

import {
  PORTFOLIO_DISCLAIMER,
  portfolioNicheLabels,
} from "../portfolio.labels";
import type { PortfolioModel } from "../portfolio.schema";
import { CopyLinkButton } from "./copy-link-button";
import { PortfolioCover } from "./portfolio-cover";

type PortfolioCardProps = {
  model: PortfolioModel;
};

export function PortfolioCard({ model }: PortfolioCardProps) {
  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      overflow="hidden"
      data-testid="portfolio-card"
      data-model-id={model.id}
    >
      <PortfolioCover model={model} />
      <Card.Body py="4" px="4">
        <Stack gap="3">
          <Stack gap="1">
            <Heading as="h2" size="sm">
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
            <Text
              fontSize="xs"
              color="fg.muted"
              data-testid="portfolio-card-disclaimer"
            >
              {PORTFOLIO_DISCLAIMER}
            </Text>
          </Stack>

          <Text fontSize="sm">{model.description}</Text>

          <Stack as="ul" gap="1" pl="4" css={{ listStyleType: "disc" }}>
            {model.features.map((feature) => (
              <Text as="li" key={feature} fontSize="sm">
                {feature}
              </Text>
            ))}
          </Stack>

          <HStack gap="2" align="stretch" flexWrap={{ base: "wrap", sm: "nowrap" }}>
            <Button asChild size="md" minH="touch" flex="1">
              <a
                href={model.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="portfolio-open-demo"
              >
                Abrir demonstração
              </a>
            </Button>
            <CopyLinkButton url={model.previewUrl} />
          </HStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
