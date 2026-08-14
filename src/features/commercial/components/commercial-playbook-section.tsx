"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Card,
  Clipboard,
  Flex,
  Heading,
  NativeSelect,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

import type { CadenceStep } from "../playbook-v1";
import type { CommercialPlaybookView } from "../playbook-view";

type CommercialPlaybookSectionProps = {
  view: CommercialPlaybookView;
};

export function CommercialPlaybookSection({
  view,
}: CommercialPlaybookSectionProps) {
  const [step, setStep] = useState<CadenceStep>("D0");
  const [replyId, setReplyId] = useState("");

  if (view.status === "unavailable") {
    return (
      <Card.Root
        variant="outline"
        borderRadius="card"
        data-testid="commercial-playbook"
        data-playbook-status="unavailable"
      >
        <Card.Header pb="2">
          <Heading as="h2" size="md" id="commercial-playbook-heading">
            Abordagem comercial
          </Heading>
        </Card.Header>
        <Card.Body>
          <Text fontSize="sm" color="fg.muted" data-testid="playbook-unavailable">
            {view.message}
          </Text>
        </Card.Body>
      </Card.Root>
    );
  }

  const selected = view.steps.find((item) => item.step === step) ?? view.steps[0];
  const selectedReply = view.replies.find((item) => item.id === replyId);

  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      data-testid="commercial-playbook"
      data-playbook-status="available"
    >
      <Card.Header pb="2">
        <Heading as="h2" size="md" id="commercial-playbook-heading">
          Abordagem comercial
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Scripts aprovados para este recorte. Copiar ou abrir o WhatsApp não
          registra o contato.
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap="6">
          {view.reasons.length > 0 ? (
            <Stack gap="3" data-testid="playbook-reasons">
              <Text fontSize="sm" fontWeight="semibold">
                Por que este lead?
              </Text>
              <Flex gap="2" flexWrap="wrap">
                {view.reasons.map((reason) => (
                  <Text
                    as="span"
                    key={reason.code}
                    fontSize="sm"
                    px="2.5"
                    py="1.5"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border"
                    bg="bg.muted"
                    lineHeight="short"
                    data-testid="playbook-signal"
                    data-signal={reason.code}
                  >
                    {reason.label}
                  </Text>
                ))}
              </Flex>
              <Stack gap="1" as="ul" ps="4">
                {view.reasons.map((reason) => (
                  <Text as="li" key={`${reason.code}-text`} fontSize="sm">
                    {reason.text}
                  </Text>
                ))}
              </Stack>
            </Stack>
          ) : null}

          <Stack gap="3" minW={0}>
            <Text fontSize="sm" fontWeight="semibold" id="playbook-step-label">
              Etapa
            </Text>
            <Tabs.Root
              value={step}
              onValueChange={(details) => {
                if (details.value) {
                  setStep(details.value as CadenceStep);
                }
              }}
              variant="enclosed"
              size="sm"
            >
              <Box overflowX="auto" maxW="full">
                <Tabs.List
                  flexWrap="nowrap"
                  w="max-content"
                  minW="full"
                  aria-labelledby="playbook-step-label"
                >
                  {view.steps.map((item) => (
                    <Tabs.Trigger
                      key={item.step}
                      value={item.step}
                      flexShrink={0}
                      whiteSpace="nowrap"
                      data-testid={`playbook-step-${item.step}`}
                    >
                      {item.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Box>
            </Tabs.Root>
          </Stack>

          <Stack gap="3" minW={0}>
            <Text fontSize="sm" fontWeight="semibold">
              Mensagem sugerida
            </Text>
            <Box
              p="4"
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              bg="bg.muted"
              w="full"
              minW={0}
            >
              <Text
                fontSize="md"
                lineHeight="tall"
                whiteSpace="pre-wrap"
                overflowWrap="anywhere"
                data-testid="playbook-message"
                data-step={selected?.step}
                data-template-found={selected?.found ? "true" : "false"}
              >
                {selected?.text}
              </Text>
            </Box>

            <Stack gap="2" direction={{ base: "column", sm: "row" }}>
              <Clipboard.Root value={selected?.found ? selected.text : ""}>
                <Clipboard.Trigger asChild>
                  <Button
                    size="md"
                    minH="11"
                    width={{ base: "full", sm: "auto" }}
                    flex="1"
                    disabled={!selected?.found}
                    data-testid="playbook-copy"
                    aria-label="Copiar mensagem"
                  >
                    <Clipboard.Indicator copied="Copiado">
                      Copiar mensagem
                    </Clipboard.Indicator>
                  </Button>
                </Clipboard.Trigger>
              </Clipboard.Root>
              {view.whatsappUrl ? (
                <Button
                  asChild
                  size="md"
                  minH="11"
                  variant="outline"
                  colorPalette="gray"
                  width={{ base: "full", sm: "auto" }}
                  flex="1"
                  data-testid="playbook-whatsapp"
                >
                  <a
                    href={view.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir WhatsApp
                  </a>
                </Button>
              ) : null}
            </Stack>
          </Stack>

          <Stack gap="2">
            <Text fontSize="sm">
              Depois de enviar, registre o resultado da abordagem.
            </Text>
            <Button
              asChild
              size="md"
              minH="11"
              variant="outline"
              colorPalette="gray"
              width={{ base: "full", sm: "auto" }}
              data-testid="playbook-register"
            >
              <NextLink href="#register-activity">Registrar resultado</NextLink>
            </Button>
          </Stack>

          <Stack gap="3" minW={0} data-testid="playbook-replies">
            <Text fontSize="sm" fontWeight="semibold" id="playbook-reply-label">
              Respostas rápidas
            </Text>
            <NativeSelect.Root size="lg" maxW="full">
              <NativeSelect.Field
                minH="11"
                value={replyId}
                aria-labelledby="playbook-reply-label"
                data-testid="playbook-reply-select"
                onChange={(event) => setReplyId(event.target.value)}
              >
                <option value="">Selecionar situação</option>
                {view.replies.map((reply) => (
                  <option key={reply.id} value={reply.id}>
                    {reply.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            {selectedReply ? (
              <Stack gap="2">
                <Box
                  p="4"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="md"
                  bg="bg.muted"
                >
                  <Text
                    fontSize="md"
                    lineHeight="tall"
                    whiteSpace="pre-wrap"
                    overflowWrap="anywhere"
                    data-testid="playbook-reply-text"
                  >
                    {selectedReply.text}
                  </Text>
                </Box>
                <Clipboard.Root value={selectedReply.text}>
                  <Clipboard.Trigger asChild>
                    <Button
                      size="md"
                      minH="11"
                      variant="outline"
                      colorPalette="gray"
                      width={{ base: "full", sm: "auto" }}
                      data-testid="playbook-reply-copy"
                      aria-label="Copiar resposta"
                    >
                      <Clipboard.Indicator copied="Copiado">
                        Copiar
                      </Clipboard.Indicator>
                    </Button>
                  </Clipboard.Trigger>
                </Clipboard.Root>
              </Stack>
            ) : null}
          </Stack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
