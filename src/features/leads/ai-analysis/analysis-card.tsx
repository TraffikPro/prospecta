"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Box, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { SectionHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { getLeadAIAnalysisAction, requestLeadAIAnalysisAction } from "@/server/actions/lead-ai-analysis";
import type { AnalysisResponse } from "@/server/lead-ai-analysis/service";
import { LeadAnalysisReport } from "./analysis-report";
import { analysisDate, analysisError, isAnalysisBlocked } from "./presentation";

type Props = { leadId: string; initial: AnalysisResponse; simulated: boolean };
const labels = { RUNNING: "Em andamento", COMPLETE: "Análise concluída", INCONCLUSIVE: "Informação insuficiente", FAILED: "Análise não concluída" };

export function LeadAnalysisCard({ leadId, initial, simulated }: Props) {
  const [response, setResponse] = useState(initial);
  const [pending, setPending] = useState(false);
  const [waitExceeded, setWaitExceeded] = useState(false);
  const requestKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const analysis = response.ok ? response.analysis : null;
  const running = analysis?.status === "RUNNING";
  const blocked = isAnalysisBlocked(response);
  const busy = pending || (running && !waitExceeded);
  const error = analysisError(response);

  useEffect(() => {
    if (!running || pending || waitExceeded) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + 100_000;
    async function poll() {
      try {
        const next = await getLeadAIAnalysisAction(leadId);
        if (disposed) return;
        setResponse(next);
        if (next.ok && next.analysis?.status === "RUNNING") {
          if (Date.now() >= deadline) setWaitExceeded(true);
          else timer = setTimeout(poll, 2_500);
        }
      } catch {
        if (!disposed) setResponse({ ok: false, code: "INTERNAL" });
      }
    }
    timer = setTimeout(poll, 2_500);
    return () => { disposed = true; clearTimeout(timer); };
  }, [leadId, running, pending, waitExceeded]);

  async function request() {
    if (inFlight.current || busy || blocked) return;
    inFlight.current = true;
    setPending(true);
    setWaitExceeded(false);
    try {
      // Preserve the key after an ambiguous transport failure; no duplicate execution.
      requestKey.current ??= crypto.randomUUID();
      const next = await requestLeadAIAnalysisAction({ leadId, requestKey: requestKey.current });
      setResponse(next);
      if (next.ok || (!next.ok && next.code === "STALE_RUN")) requestKey.current = null;
    } catch { setResponse({ ok: false, code: "INTERNAL" }); }
    finally { inFlight.current = false; setPending(false); }
  }
  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setWaitExceeded(false);
    try { setResponse(await getLeadAIAnalysisAction(leadId)); }
    catch { setResponse({ ok: false, code: "INTERNAL" }); }
    finally { inFlight.current = false; setPending(false); }
  }

  return <Stack as="section" aria-labelledby="ai-analysis-heading" data-testid="ai-analysis-card"
    gap="4" borderWidth="1px" borderColor="border" borderRadius="surface" p={{ base: "4", md: "5" }} minW="0">
    <Stack gap="2">
      <HStack justify="space-between" align="start" flexWrap="wrap">
        <SectionHeading id="ai-analysis-heading">Análise do lead com IA</SectionHeading>
        {simulated ? <Badge colorPalette="orange">Demonstração local</Badge> : null}
      </HStack>
      <Text fontSize="sm" color="fg.muted">Pesquise a presença digital e encontre possibilidades de abordagem apoiadas em evidências.</Text>
      {simulated ? <Text fontSize="xs" color="fg.muted">Resultado simulado com dados fictícios. Nenhuma consulta externa é realizada.</Text> : null}
    </Stack>
    <Box role="status" aria-live="polite" aria-atomic="true">
      {busy ? <HStack gap="2"><Spinner size="sm" /><Text fontSize="sm">Analisando o lead. Aguarde o resultado…</Text></HStack>
        : analysis ? <Badge colorPalette={analysis.status === "COMPLETE" ? "green" : analysis.status === "FAILED" ? "red" : "gray"}>{labels[analysis.status]}</Badge>
          : !error ? <Text fontSize="sm">Nenhuma análise foi realizada para este lead.</Text> : null}
    </Box>
    {error ? <Text role="alert" fontSize="sm" color="fg.error">{error}</Text> : null}
    {analysis?.status === "FAILED" ? <Text fontSize="sm">Não foi possível concluir a pesquisa. Você pode tentar novamente.</Text> : null}
    {analysis?.status === "INCONCLUSIVE" ? <Text fontSize="sm">Não há evidências suficientes para sugerir uma abordagem. Confira abaixo as informações que faltam.</Text> : null}
    {waitExceeded ? <Text role="status" fontSize="sm">A análise está demorando mais que o esperado. Atualize o resultado ou tente uma nova análise.</Text> : null}
    {analysis?.report ? <LeadAnalysisReport report={analysis.report} /> : null}
    {analysis?.finishedAt ? <Text fontSize="xs" color="fg.muted">Última análise: {analysisDate(analysis.finishedAt)}</Text> : null}
    <HStack gap="3" flexWrap="wrap">
      <Button type="button" onClick={request} disabled={Boolean(busy || blocked)} size="sm">
        {pending ? "Aguarde…" : analysis ? "Analisar novamente" : error ? "Tentar novamente" : "Analisar lead"}
      </Button>
      {running || error ? <Button type="button" variant="ghost" size="sm" onClick={refresh} disabled={pending}>Atualizar resultado</Button> : null}
    </HStack>
  </Stack>;
}
