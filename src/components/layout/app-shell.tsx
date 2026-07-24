"use client";

import type { ReactNode } from "react";

import { Box, Container, HStack, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/features/auth/logout-button";

type AppShellProps = {
  userName: string;
  userRole: string;
  children: ReactNode;
};

const NAV = [
  { href: "/app/my-leads", label: "Minha fila" },
  { href: "/app/intelligence", label: "Inteligência" },
  { href: "/app/leads", label: "Leads" },
  { href: "/app/pipeline", label: "Pipeline" },
] as const;

export function AppShell({ userName, userRole, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Box
        as="header"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg"
      >
        <Container maxW="3xl" py="4" px="6">
          <Stack gap="3">
            <HStack justify="space-between" align="center" gap="4">
              <Stack gap="0">
                <Text fontSize="sm" fontWeight="semibold">
                  Prospecta
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {userName} · {userRole}
                </Text>
              </Stack>
              <LogoutButton />
            </HStack>
            <HStack as="nav" gap="4" flexWrap="wrap" aria-label="Principal">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <ChakraLink asChild key={item.href}>
                    <NextLink
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: active ? 600 : 400,
                        textDecoration: active ? "underline" : "none",
                        textUnderlineOffset: "3px",
                        opacity: active ? 1 : 0.8,
                      }}
                    >
                      {item.label}
                    </NextLink>
                  </ChakraLink>
                );
              })}
            </HStack>
          </Stack>
        </Container>
      </Box>
      <Container as="div" maxW="3xl" px="6" py="8">
        {children}
      </Container>
    </Box>
  );
}
