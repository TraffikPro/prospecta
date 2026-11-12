"use client";

import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import type { AnalysisReport } from "@/server/ai-analysis/schemas";
import { analysisDate, evidenceHref } from "./presentation";

function EvidenceReferences({ ids, report }: { ids: string[]; report: AnalysisReport }) {
  const sources = report.evidence.filter((item) => ids.includes(item.id));
  return <Box fontSize="xs" mt="1">
    {sources.map((item, index) => <Link key={item.id} href={`#ai-evidence-${encodeURIComponent(item.id)}`} mr="3" textDecoration="underline">
      Evidência {report.evidence.indexOf(item) + 1}{index < sources.length - 1 ? ";" : ""}
    </Link>)}
  </Box>;
}

export function LeadAnalysisReport({ report }: { report: AnalysisReport }) {
  return <Stack gap="5" data-testid="ai-analysis-report" overflowWrap="anywhere">
    {report.summary ? <Text fontSize="sm">{report.summary}</Text> : null}
    {report.digitalPresence.observations.length > 0 ? <Stack gap="2">
      <Heading as="h3" fontSize="sm">Presença digital</Heading>
      {report.digitalPresence.observations.map((item, index) => <Box key={index} fontSize="sm">
        <Text>{item.statement}</Text><EvidenceReferences ids={item.evidenceIds} report={report} />
      </Box>)}
    </Stack> : null}
    {report.opportunities.length > 0 ? <Stack gap="3">
      <Heading as="h3" fontSize="sm">Hipóteses para explorar</Heading>
      <Text fontSize="xs" color="fg.muted">Valide estas possibilidades em conversa com o lead.</Text>
      {report.opportunities.map((item, index) => <Box key={index} borderLeftWidth="2px" borderColor="border" pl="3">
        <Text fontSize="sm" fontWeight="semibold">{item.hypothesis}</Text>
        <Text fontSize="sm" color="fg.muted">{item.rationale}</Text>
        <EvidenceReferences ids={item.evidenceIds} report={report} />
      </Box>)}
    </Stack> : null}
    {report.insufficientInformation.length > 0 ? <Stack gap="2">
      <Heading as="h3" fontSize="sm">O que ainda falta saber</Heading>
      <Box as="ul" pl="5" fontSize="sm">{report.insufficientInformation.map((text, i) => <li key={i}>{text}</li>)}</Box>
    </Stack> : null}
    {report.evidence.length > 0 ? <Stack gap="3">
      <Heading as="h3" fontSize="sm">Evidências</Heading>
      {report.evidence.map((item, index) => {
        const href = evidenceHref(item.url);
        return <Box key={item.id} id={`ai-evidence-${item.id}`} tabIndex={-1} scrollMarginTop="6rem" p="3" borderRadius="md" bg="bg.subtle">
          <Text fontSize="xs" fontWeight="semibold" mb="1">Evidência {index + 1}</Text>
          <Text as="blockquote" fontSize="sm" mb="2">{item.excerpt}</Text>
          {href ? <Link href={href} target="_blank" rel="noopener noreferrer" fontSize="xs" textDecoration="underline">{new URL(href).hostname} ↗</Link> : <Text fontSize="xs">Fonte indisponível</Text>}
          <Text fontSize="xs" color="fg.muted">Coletada em {analysisDate(item.collectedAt)}</Text>
        </Box>;
      })}
    </Stack> : null}
    {report.limitations.length > 0 ? <Stack gap="2">
      <Heading as="h3" fontSize="sm">Limitações da análise</Heading>
      <Box as="ul" pl="5" fontSize="xs" color="fg.muted">{report.limitations.map((text, i) => <li key={i}>{text}</li>)}</Box>
    </Stack> : null}
  </Stack>;
}
