"use client";

import NextLink from "next/link";
import { HStack, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

type LeadContactActionsProps = {
  phone: string | null;
  email: string | null;
};

function toWhatsAppUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }
  return `https://wa.me/${digits}`;
}

export function LeadContactActions({ phone, email }: LeadContactActionsProps) {
  const whatsappUrl = phone ? toWhatsAppUrl(phone) : null;

  return (
    <Stack gap="3" data-testid="lead-contact-actions">
      <Text fontSize="sm" fontWeight="semibold">
        Contato
      </Text>
      <HStack gap="2" flexWrap="wrap" align="stretch">
        {whatsappUrl ? (
          <Button asChild size="md" minH="11" flex="1">
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
          >
            <a href={`mailto:${email}`}>E-mail</a>
          </Button>
        ) : null}
        {!whatsappUrl && !email ? (
          <Text fontSize="sm" color="fg.muted">
            Sem telefone ou e-mail cadastrado.
          </Text>
        ) : null}
      </HStack>
      <Button
        asChild
        size="md"
        minH="11"
        variant="outline"
        width={{ base: "full", md: "fit-content" }}
      >
        <NextLink href="#register-activity">Registrar resultado</NextLink>
      </Button>
    </Stack>
  );
}
