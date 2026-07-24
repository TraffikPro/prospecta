import { Box, Text } from "@chakra-ui/react";

import type { PortfolioModel } from "../portfolio.schema";

const ACCENT_GRADIENT: Record<
  NonNullable<PortfolioModel["coverAccent"]>,
  string
> = {
  teal: "linear-gradient(135deg, #0f766e 0%, #99f6e4 100%)",
  slate: "linear-gradient(135deg, #1e293b 0%, #94a3b8 100%)",
  amber: "linear-gradient(135deg, #92400e 0%, #fcd34d 100%)",
};

type PortfolioCoverProps = {
  model: PortfolioModel;
};

export function PortfolioCover({ model }: PortfolioCoverProps) {
  if (model.coverImage) {
    return (
      <Box
        w="100%"
        h="140px"
        borderTopRadius="card"
        overflow="hidden"
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
      h="140px"
      w="100%"
      borderTopRadius="card"
      backgroundImage={ACCENT_GRADIENT[accent]}
      display="flex"
      alignItems="flex-end"
      px="4"
      py="3"
      data-testid="portfolio-cover-accent"
    >
      <Text
        color="white"
        fontWeight="semibold"
        fontSize="lg"
        textShadow="0 1px 2px rgba(0,0,0,0.35)"
      >
        {model.title}
      </Text>
    </Box>
  );
}
