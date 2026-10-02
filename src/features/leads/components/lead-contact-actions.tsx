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
    <Stack gap="1.5" data-testid="lead-contact-actions">
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        lineHeight="1.2"
        data-testid="lead-manual-contact-label"
      >
        Contato manual (Sprint 0)
      </Text>

      {!hasChannel ? (
        <AppEmptyState
          variant="compact"
          data-testid="lead-contact-unavailable"
          title="Contato indisponível"
          description="Este lead não possui telefone ou e-mail cadastrado."
        />
      ) : (
        <HStack gap="1.5" align="stretch" flexWrap="nowrap">
          {whatsappUrl ? (
            <Button asChild size="md" minH="11" flex="1" minW="0" px="2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Contatar
              </a>
            </Button>
          ) : null}
          {email ? (
            <Button
              asChild
              size="md"
              minH="11"
              variant="outline"
              colorPalette="gray"
              flex="1"
              minW="0"
              px="2"
            >
              <a href={`mailto:${email}`}>E-mail</a>
            </Button>
          ) : null}
        </HStack>
      )}

      <Button
        asChild
        size="md"
        minH="11"
        variant="outline"
        width="full"
        fontSize="sm"
      >
        <NextLink href="#register-activity">
          {hasChannel ? "Registrar resultado" : "Registrar atividade"}
        </NextLink>
      </Button>
    </Stack>
  );
}
