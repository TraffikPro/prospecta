"use client";

import NextLink from "next/link";
import { HStack, Stack, Text } from "@chakra-ui/react";

import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { toWhatsAppUrl } from "@/features/leads/whatsapp-url";

type LeadContactActionsProps = {
  phone: string | null;
  email: string | null;
};

export function LeadContactActions({ phone, email }: LeadContactActionsProps) {
  const whatsappUrl = toWhatsAppUrl(phone);
  const hasChannel = Boolean(whatsappUrl || email);

  return (
    <Stack
      gap="2"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      px="3"
      py="3"
      data-testid="lead-contact-actions"
    >
      <Text fontSize="sm" fontWeight="semibold" lineHeight="1.2">
        Contato
      </Text>

      {!hasChannel ? (
        <AppEmptyState
          variant="compact"
          data-testid="lead-contact-unavailable"
          title="Contato indisponível"
          description="Este lead não possui telefone ou e-mail cadastrado."
        />
      ) : (
        <HStack gap="2" align="stretch" flexWrap="nowrap">
          {whatsappUrl ? (
            <Button asChild size="md" minH="touch" flex="1" minW="0">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Contatar
              </a>
            </Button>
          ) : null}
          {email ? (
            <Button
              asChild
              size="md"
              minH="touch"
              variant="outline"
              colorPalette="gray"
              flex="1"
              minW="0"
            >
              <a href={`mailto:${email}`}>E-mail</a>
            </Button>
          ) : null}
        </HStack>
      )}

      <Button asChild size="md" minH="touch" variant="outline" width="full">
        <NextLink href="#register-activity">
          {hasChannel ? "Registrar resultado" : "Registrar atividade"}
        </NextLink>
      </Button>
    </Stack>
  );
}
