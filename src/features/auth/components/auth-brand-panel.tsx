import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import { PipelineGraphic } from "./pipeline-graphic";
import { ProspectaMark } from "./prospecta-mark";

/** Desktop-only brand column for the login shell. */
export function AuthBrandPanel() {
  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      overflow="hidden"
      px="12"
      py="12"
      h="full"
      minH="100vh"
      bgGradient="to-br"
      gradientFrom="brand.800"
      gradientVia="brand.900"
      gradientTo="brand.950"
      data-testid="login-brand-panel"
    >
      <Box
        position="absolute"
        inset="0"
        pointerEvents="none"
        opacity="0.5"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <Box
        position="absolute"
        pointerEvents="none"
        top="30%"
        left="-10%"
        w="60%"
        h="60%"
        borderRadius="full"
        bg="brand.solid"
        opacity="0.18"
        filter="blur(80px)"
      />

      <Stack
        position="relative"
        zIndex="1"
        direction="row"
        align="center"
        gap="3"
        data-testid="prospecta-wordmark"
      >
        <ProspectaMark size={40} light />
        <Box>
          <Text
            as="span"
            display="block"
            fontSize="xl"
            fontWeight="semibold"
            color="white"
            lineHeight="1.1"
            letterSpacing="tight"
          >
            Prospecta
          </Text>
          <Text
            as="span"
            display="block"
            fontSize="xs"
            color="whiteAlpha.600"
            letterSpacing="wide"
          >
            por DevFlow Labs
          </Text>
        </Box>
      </Stack>

      <Stack
        position="relative"
        zIndex="1"
        flex="1"
        justify="center"
        maxW="460px"
        gap="4"
        py="10"
      >
        <Heading
          as="h2"
          fontSize="4xl"
          fontWeight="semibold"
          lineHeight="tight"
          letterSpacing="tight"
          color="white"
        >
          Transforme oportunidades em próximas ações.
        </Heading>
        <Text fontSize="md" lineHeight="tall" color="whiteAlpha.700" mb="8">
          Organize leads, contatos e follow-ups em um único fluxo comercial.
        </Text>
        <PipelineGraphic />
      </Stack>
    </Box>
  );
}
