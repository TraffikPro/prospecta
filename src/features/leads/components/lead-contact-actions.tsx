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
    <Stack gap="1" data-testid="lead-contact-actions">
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        lineHeight="1.2"
        mb="0"
      >
        Contato
      </Text>
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
        <Button
          asChild
          size="md"
          minH="11"
          variant="outline"
          flex="1"
          minW="0"
          px="2"
          fontSize="sm"
        >
          <NextLink href="#register-activity">Registrar resultado</NextLink>
        </Button>
      </HStack>
      {!whatsappUrl && !email ? (
        <Text fontSize="sm" color="fg.muted">
          Sem telefone ou e-mail cadastrado.
        </Text>
      ) : null}
    </Stack>
  );
}
