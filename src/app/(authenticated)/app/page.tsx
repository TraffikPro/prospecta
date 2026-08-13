import Link from "next/link";
import { redirect } from "next/navigation";
import { SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/server/auth/session";

type Shortcut = {
  href: string;
  label: string;
  description: string;
};

export default async function AppHomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  const shortcuts: Shortcut[] = [
    {
      href: "/app/my-leads",
      label: "Minha fila",
      description: "Priorize follow-ups e próximos contatos.",
    },
    {
      href: "/app/intelligence",
      label: "Inteligência",
      description: "Oportunidades ordenadas por score.",
    },
    {
      href: "/app/pipeline",
      label: "Pipeline",
      description: "Veja leads por etapa do funil.",
    },
    {
      href: "/app/portfolio",
      label: "Portfólio",
      description: "Modelos demonstrativos para apresentar na conversa.",
    },
  ];

  if (user.role === "ADMIN") {
    shortcuts.push({
      href: "/app/leads",
      label: "Leads",
      description: "Lista completa e cadastro manual.",
    });
  }

  if (user.role === "ADMIN") {
    shortcuts.push({
      href: "/admin/acquisition",
      label: "Aquisição",
      description: "Puxar leads Places via runner externo.",
    });
  }

  if (user.role === "ADMIN") {
    shortcuts.push({
      href: "/admin/users",
      label: "Equipe",
      description: "Operadores, permissões e autorização de aquisição.",
    });
  } else {
    shortcuts.push({
      href: "/app/leads/new",
      label: "Novo lead",
      description: "Cadastre um contato para trabalhar.",
    });
  }

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Visão geral" }]} />
      <PageHeading
        title="Visão geral"
        meta={`Olá, ${firstName}. Escolha por onde começar a operação de hoje.`}
        actions={
          <Button asChild size="md" minH="touch">
            <Link href="/app/my-leads">Abrir minha fila</Link>
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
        {shortcuts.map((item) => (
          <Stack
            key={item.href}
            borderWidth="1px"
            borderColor="border"
            borderRadius="card"
            bg="bg"
            p="4"
            gap="3"
            justify="space-between"
            minH="touch"
          >
            <Stack gap="1">
              <Text fontWeight="semibold">{item.label}</Text>
              <Text textStyle="meta">{item.description}</Text>
            </Stack>
            <Button asChild size="md" minH="touch" alignSelf="stretch">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          </Stack>
        ))}
      </SimpleGrid>
    </PageFrame>
  );
}
