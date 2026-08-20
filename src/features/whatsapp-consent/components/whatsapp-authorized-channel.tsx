"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WhatsAppConsentEventStatus,
  WhatsAppConsentPurpose,
  WhatsAppConsentSource,
  WhatsAppConsentStatus,
} from "@prisma/client";
import {
  Alert,
  Card,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { notifySuccess } from "@/components/ui/toaster";
import {
  AUTHORIZED_API_UNAVAILABLE_COPY,
  whatsappConsentPurposeLabels,
  whatsappConsentSourceLabels,
  whatsappConsentStatusLabels,
} from "@/features/whatsapp-consent/consent.labels";
import {
  WHATSAPP_CONSENT_PURPOSES,
  WHATSAPP_CONSENT_SOURCES,
} from "@/features/whatsapp-consent/consent.schema";
import {
  recordWhatsAppConsentAction,
  type RecordWhatsAppConsentState,
} from "@/server/actions/whatsapp-consent";

export type WhatsAppConsentHistoryItem = {
  id: string;
  status: WhatsAppConsentEventStatus;
  source: WhatsAppConsentSource;
  purpose: WhatsAppConsentPurpose | null;
  purposeNote: string | null;
  evidenceAt: string;
  createdAt: string;
  actorName: string;
};

type WhatsAppAuthorizedChannelProps = {
  leadId: string;
  status: WhatsAppConsentStatus;
  phoneE164: string | null;
  suggestedE164: string | null;
  history: WhatsAppConsentHistoryItem[];
};

const initialState: RecordWhatsAppConsentState = {};

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function WhatsAppAuthorizedChannel({
  leadId,
  status,
  phoneE164,
  suggestedE164,
  history,
}: WhatsAppAuthorizedChannelProps) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<WhatsAppConsentPurpose>("PRESENTATION");
  const [optInState, optInAction, optInPending] = useActionState(
    async (prev: RecordWhatsAppConsentState, formData: FormData) => {
      const next = await recordWhatsAppConsentAction(prev, formData);
      if (next.ok) {
        notifySuccess("Autorização registrada");
      }
      return next;
    },
    initialState,
  );
  const [optOutState, optOutAction, optOutPending] = useActionState(
    async (prev: RecordWhatsAppConsentState, formData: FormData) => {
      const next = await recordWhatsAppConsentAction(prev, formData);
      if (next.ok) {
        notifySuccess("Recusa registrada");
      }
      return next;
    },
    initialState,
  );

  useEffect(() => {
    if (optInState.ok || optOutState.ok) {
      router.refresh();
    }
  }, [optInState.ok, optOutState.ok, router]);

  const nowLocal = toDatetimeLocalValue(new Date());

  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      data-testid="whatsapp-authorized-channel"
      data-consent-status={status}
    >
      <Card.Header pb="2">
        <Heading as="h2" size="md" id="whatsapp-authorized-heading">
          Canal autorizado
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Futuro envio via API. Não substitui o contato manual.
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap="4">
          <Stack gap="1">
            <Text fontSize="sm">
              Telefone E.164:{" "}
              <Text as="span" fontWeight="medium" data-testid="whatsapp-e164">
                {phoneE164 ?? "—"}
              </Text>
            </Text>
            <Text fontSize="sm">
              Elegibilidade:{" "}
              <Text
                as="span"
                fontWeight="medium"
                data-testid="whatsapp-eligibility-status"
              >
                {whatsappConsentStatusLabels[status]}
              </Text>
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Conversa: Não vinculada
            </Text>
          </Stack>

          {status === "OPTED_IN" ? (
            <Alert.Root status="info" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description data-testid="whatsapp-api-unavailable">
                  {AUTHORIZED_API_UNAVAILABLE_COPY}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          {status === "OPTED_OUT" ? (
            <Alert.Root status="warning" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  Recusa em vigor. Autorização anterior permanece só no
                  histórico.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <form action={optInAction} data-testid="whatsapp-opt-in-form">
            <Stack gap="3">
              <input type="hidden" name="leadId" value={leadId} />
              <input type="hidden" name="status" value="OPTED_IN" />
              <Heading as="h3" size="sm">
                Registrar autorização
              </Heading>
              <Field.Root required>
                <Field.Label>Fonte</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field name="source" minH="11">
                    {WHATSAPP_CONSENT_SOURCES.map((value) => (
                      <option key={value} value={value}>
                        {whatsappConsentSourceLabels[value]}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>Finalidade</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    name="purpose"
                    minH="11"
                    value={purpose}
                    onChange={(event) =>
                      setPurpose(event.target.value as WhatsAppConsentPurpose)
                    }
                  >
                    {WHATSAPP_CONSENT_PURPOSES.map((value) => (
                      <option key={value} value={value}>
                        {whatsappConsentPurposeLabels[value]}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              {purpose === "OTHER" ? (
                <Field.Root required>
                  <Field.Label>Descrição da finalidade</Field.Label>
                  <Textarea name="purposeNote" maxLength={200} required />
                </Field.Root>
              ) : null}
              <Field.Root required>
                <Field.Label>Data da evidência</Field.Label>
                <Input
                  type="datetime-local"
                  name="evidenceAt"
                  defaultValue={nowLocal}
                  required
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Telefone E.164</Field.Label>
                <Input
                  name="phoneE164"
                  defaultValue={phoneE164 ?? suggestedE164 ?? ""}
                  placeholder="+5513999999999"
                  required
                />
                <Field.HelperText>
                  Sugestão a partir do telefone legado — não é consentimento.
                </Field.HelperText>
              </Field.Root>
              {optInState.error ? (
                <Alert.Root status="error" variant="subtle" role="alert">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{optInState.error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              ) : null}
              <Button
                type="submit"
                loading={optInPending}
                disabled={optInPending}
              >
                Registrar autorização
              </Button>
            </Stack>
          </form>

          <form action={optOutAction} data-testid="whatsapp-opt-out-form">
            <Stack gap="3">
              <input type="hidden" name="leadId" value={leadId} />
              <input type="hidden" name="status" value="OPTED_OUT" />
              <Heading as="h3" size="sm">
                Registrar recusa
              </Heading>
              <Field.Root required>
                <Field.Label>Fonte da recusa</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field name="source" minH="11">
                    {WHATSAPP_CONSENT_SOURCES.map((value) => (
                      <option key={value} value={value}>
                        {whatsappConsentSourceLabels[value]}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>Data da evidência</Field.Label>
                <Input
                  type="datetime-local"
                  name="evidenceAt"
                  defaultValue={nowLocal}
                  required
                />
              </Field.Root>
              {optOutState.error ? (
                <Alert.Root status="error" variant="subtle" role="alert">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{optOutState.error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              ) : null}
              <Button
                type="submit"
                variant="outline"
                colorPalette="gray"
                loading={optOutPending}
                disabled={optOutPending}
              >
                Registrar recusa
              </Button>
            </Stack>
          </form>

          <Stack gap="2" data-testid="whatsapp-consent-history">
            <Heading as="h3" size="sm">
              Histórico de consentimento
            </Heading>
            {history.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                Nenhuma alteração registrada.
              </Text>
            ) : (
              history.map((item) => (
                <Text
                  key={item.id}
                  fontSize="sm"
                  data-testid="whatsapp-consent-event"
                  data-event-status={item.status}
                >
                  {whatsappConsentStatusLabels[item.status]} ·{" "}
                  {whatsappConsentSourceLabels[item.source]}
                  {item.purpose
                    ? ` · ${whatsappConsentPurposeLabels[item.purpose]}`
                    : ""}
                  {item.purposeNote ? ` (${item.purposeNote})` : ""} · evidência{" "}
                  {formatDateTime(item.evidenceAt)} · registro{" "}
                  {formatDateTime(item.createdAt)} · {item.actorName}
                </Text>
              ))
            )}
          </Stack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
