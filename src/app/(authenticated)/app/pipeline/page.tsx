import Link from "next/link";
import { redirect } from "next/navigation";
import { Heading, HStack, Link as ChakraLink, Stack } from "@chakra-ui/react";

import { ContextualNav } from "@/components/navigation";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getLeadsGroupedByStage } from "@/server/services/lead.service";

export default async function PipelinePage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const grouped = await getLeadsGroupedByStage();

  return (
    <Stack as="main" gap="8">
      <ContextualNav items={[{ label: "Pipeline" }]} />
      <HStack justify="space-between" align="center" gap="4" flexWrap="wrap">
        <Heading as="h1" size="lg" fontWeight="semibold">
          Pipeline
        </Heading>
        <ChakraLink asChild fontSize="sm" textDecoration="underline">
          <Link href="/app/leads">Ver lista</Link>
        </ChakraLink>
      </HStack>

      <PipelineBoard grouped={grouped} />
    </Stack>
  );
}
