import Link from "next/link";
import { redirect } from "next/navigation";
import { Link as ChakraLink, SimpleGrid, Stack, Text } from "@chakra-ui/react";

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
  ];

  if (user.role === "ADMIN") {
    shortcuts.push(
      {
        href: "/app/leads",
        label: "Leads",
        description: "Lista completa e cadastro manual.",
      },
      {
        href: "/admin/users",
        label: "Usuários",
        description: "Visão administrativa da equipe.",
      },
    );
  } else {
    shortcuts.push({
      href: "/app/leads/new",
      label: "Novo lead",
      description: "Cadastre um contato para trabalhar.",
    });
  }

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Início" }]} />
      <PageHeading
        title={`Olá, ${firstName}`}
        meta="Escolha por onde começar a operação de hoje."
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

      {user.role === "MEMBER" ? (
        <Text textStyle="meta">
          Atalho rápido:{" "}
          <ChakraLink asChild textDecoration="underline">
            <Link href="/app/more">Mais opções</Link>
          </ChakraLink>
        </Text>
      ) : null}
    </PageFrame>
  );
}
