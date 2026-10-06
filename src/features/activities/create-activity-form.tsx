"use client";

import type { ActivityOutcome } from "@prisma/client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState } from "react";

import {
  Alert,
  Card,
  Field,
  Fieldset,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { notifySuccess } from "@/components/ui/toaster";
import { activityOutcomeLabels } from "@/features/activities/activity.labels";
import { shouldRequireNextFollowUp } from "@/features/activities/activity.rules";
import {
  FOLLOW_UP_PRESETS,
  followUpPresetDate,
  followUpPresetUnavailableReason,
  isFollowUpPresetAvailable,
  toDatetimeLocalValue,
  type FollowUpPresetId,
} from "@/features/activities/follow-up-presets";
import {
  createActivityAction,
  type CreateActivityState,
} from "@/server/actions/activity";

const initialState: CreateActivityState = {};

const outcomes = Object.keys(activityOutcomeLabels) as ActivityOutcome[];

type Props = {
  leadId: string;
  /** Allowlisted contextual return (fila / inteligência / pipeline / leads). */
  returnHref?: string;
};

export function CreateActivityForm({
  leadId,
  returnHref = "/app/my-leads",
}: Props) {
  const router = useRouter();
  const [type, setType] = useState<"WHATSAPP" | "EMAIL" | "NOTE">("WHATSAPP");
  const [outcome, setOutcome] = useState<ActivityOutcome>("SENT_NO_REPLY");
  const [body, setBody] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: CreateActivityState, formData: FormData) => {
      const next = await createActivityAction(prev, formData);
      if (next.ok) {
        notifySuccess("Contato registrado");
        setBody("");
        setJustSaved(true);
        // Refresh on every successful save (including after "Registrar outro
        // contato"). Depending only on `state.ok` would skip refresh when it
        // stays true across consecutive saves.
        router.refresh();
      }
      return next;
    },
    initialState,
  );

  const requiresFollowUp = useMemo(
    () =>
      shouldRequireNextFollowUp({
        type,
        outcome: type === "NOTE" ? null : outcome,
      }),
    [type, outcome],
  );

  function applyFollowUpPreset(id: FollowUpPresetId) {
    const now = new Date();
    if (!isFollowUpPresetAvailable(id, now)) {
      return;
    }
    setNextFollowUpAt(toDatetimeLocalValue(followUpPresetDate(id, now)));
  }

  function startAnotherActivity() {
    setJustSaved(false);
    setBody("");
    setNextFollowUpAt("");
    setOutcome("SENT_NO_REPLY");
    setType("WHATSAPP");
  }

  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      data-testid="create-activity-form"
      data-just-saved={justSaved ? "true" : "false"}
    >
      <Card.Body>
        <form action={formAction}>
          <Stack gap="4" maxW={{ base: "full", lg: "lg" }} w="full">
            <input type="hidden" name="leadId" value={leadId} />

            <Heading as="h2" size="md" id="register-activity-heading">
              Registrar atividade
            </Heading>

            <Fieldset.Root disabled={justSaved || pending}>
              <Stack gap="4">
                <Field.Root required>
                  <Field.Label>Tipo</Field.Label>
                  <NativeSelect.Root size="lg">
                    <NativeSelect.Field
                      name="type"
                      value={type}
                      minH="11"
                      onChange={(event) =>
                        setType(
                          event.target.value as "WHATSAPP" | "EMAIL" | "NOTE",
                        )
                      }
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="NOTE">Nota</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                {type !== "NOTE" ? (
                  <Field.Root required>
                    <Field.Label>Resultado</Field.Label>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        name="outcome"
                        value={outcome}
                        minH="11"
                        onChange={(event) =>
                          setOutcome(event.target.value as ActivityOutcome)
                        }
                      >
                        {outcomes.map((value) => (
                          <option key={value} value={value}>
                            {activityOutcomeLabels[value]}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                ) : null}

                <Field.Root required>
                  <Field.Label>Descrição</Field.Label>
                  <Textarea
                    name="body"
                    required
                    rows={4}
                    minH="28"
                    fontSize="md"
                    placeholder="O que aconteceu no contato?"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </Field.Root>

                <Field.Root required={requiresFollowUp}>
                  <Field.Label>
                    Próximo passo (data)
                    {requiresFollowUp ? " — obrigatório" : " (opcional)"}
                  </Field.Label>
                  <Input
                    name="nextFollowUpAt"
                    type="datetime-local"
                    required={requiresFollowUp}
                    minH="11"
                    fontSize="md"
                    value={nextFollowUpAt}
                    onChange={(event) => setNextFollowUpAt(event.target.value)}
                  />
                  <HStack gap="2" flexWrap="wrap" pt="1" align="start">
                    {FOLLOW_UP_PRESETS.map((preset) => {
                      const now = new Date();
                      const available = isFollowUpPresetAvailable(preset.id, now);
                      const unavailableReason = followUpPresetUnavailableReason(
                        preset.id,
                        now,
                      );
                      return (
                        <Stack key={preset.id} gap="0.5" maxW="full">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            colorPalette="gray"
                            disabled={!available}
                            onClick={() => applyFollowUpPreset(preset.id)}
                            data-testid={`follow-up-preset-${preset.id}`}
                            aria-describedby={
                              !available
                                ? `follow-up-preset-${preset.id}-reason`
                                : undefined
                            }
                          >
                            {preset.label}
                          </Button>
                          {!available && unavailableReason ? (
                            <Text
                              id={`follow-up-preset-${preset.id}-reason`}
                              fontSize="xs"
                              color="fg.muted"
                            >
                              {unavailableReason}
                            </Text>
                          ) : null}
                        </Stack>
                      );
                    })}
                  </HStack>
                </Field.Root>
              </Stack>
            </Fieldset.Root>

            {state.error && !justSaved ? (
              <Alert.Root status="error" variant="subtle" role="alert">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{state.error}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            {justSaved ? (
              <Stack
                gap="2"
                position={{ base: "sticky", md: "static" }}
                bottom={{ base: "4", md: "auto" }}
                bg={{ base: "bg", md: "transparent" }}
                py={{ base: "2", md: "0" }}
                mt="2"
                zIndex="1"
                borderTopWidth={{ base: "1px", md: "0" }}
                borderColor="border"
              >
                <Alert.Root status="success" variant="subtle">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Contato registrado</Alert.Title>
                    <Alert.Description>
                      Volte à fila ou registre outro contato neste lead.
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>
                <Button
                  asChild
                  minH="11"
                  width={{ base: "full", md: "fit-content" }}
                  data-testid="activity-success-back"
                >
                  <NextLink href={returnHref}>Voltar</NextLink>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  colorPalette="gray"
                  minH="11"
                  width={{ base: "full", md: "fit-content" }}
                  data-testid="activity-register-another"
                  onClick={startAnotherActivity}
                >
                  Registrar outro contato
                </Button>
              </Stack>
            ) : (
              <Stack
                gap="2"
                position={{ base: "sticky", md: "static" }}
                bottom={{ base: "4", md: "auto" }}
                bg={{ base: "bg", md: "transparent" }}
                py={{ base: "2", md: "0" }}
                mt="2"
                zIndex="1"
                borderTopWidth={{ base: "1px", md: "0" }}
                borderColor="border"
              >
                <Button
                  type="submit"
                  width={{ base: "full", md: "fit-content" }}
                  minH="11"
                  loading={pending}
                  disabled={pending}
                >
                  {pending ? "Salvando…" : "Salvar atividade"}
                </Button>
              </Stack>
            )}
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
