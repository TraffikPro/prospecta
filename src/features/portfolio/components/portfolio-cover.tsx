import { Box, Stack, Text } from "@chakra-ui/react";

import type { PortfolioModel } from "../portfolio.schema";
import { portfolioNicheLabels } from "../portfolio.labels";

type PortfolioCoverProps = {
  model: PortfolioModel;
};

/**
 * Gallery preview surface for a Demo tile.
 * Prefers a real coverImage when published; otherwise a restrained typographic
 * cover (no decorative mesh gradients — F13).
 */
export function PortfolioCover({ model }: PortfolioCoverProps) {
  if (model.coverImage) {
    return (
      <Box
        w="100%"
        h="148px"
        borderTopRadius="surface"
        overflow="hidden"
        borderBottomWidth="1px"
        borderColor="border"
        data-testid="portfolio-cover-image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- catalog cover paths are static public assets */}
        <img
          src={model.coverImage}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>
    );
  }

  const accent = model.coverAccent ?? "teal";

  return (
    <Box
      h="132px"
      w="100%"
      borderTopRadius="surface"
      bg="bg.muted"
      borderBottomWidth="1px"
      borderColor="border"
      position="relative"
      overflow="hidden"
      data-testid="portfolio-cover-accent"
      data-cover-kind="typographic"
      data-cover-accent={accent}
    >
      <Box
        position="absolute"
        left="0"
        top="0"
        bottom="0"
        w="1"
        bg={
          accent === "slate"
            ? "gray.fg"
            : accent === "amber"
              ? "orange.solid"
              : "brand.solid"
        }
        aria-hidden
      />
      <Stack h="full" justify="center" gap="1" px="4" py="3" pl="5">
        <Text fontSize="xs" fontWeight="medium" color="fg.muted">
          {portfolioNicheLabels[model.niche]}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Site-conceito · prévia tipográfica
        </Text>
      </Stack>
    </Box>
  );
}
