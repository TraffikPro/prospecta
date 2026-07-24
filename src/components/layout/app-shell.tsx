"use client";

import type { ReactNode } from "react";

import { Box, Container, HStack, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { roleLabels } from "@/features/admin/role.labels";
import { LogoutButton } from "@/features/auth/logout-button";

type AppShellProps = {
  userName: string;
  userRole: string;
  children: ReactNode;
};

const PRIMARY_NAV = [
  { href: "/app/my-leads", label: "Minha fila" },
  { href: "/app/intelligence", label: "Inteligência" },
  { href: "/app/pipeline", label: "Pipeline" },
  { href: "/app/more", label: "Mais" },
] as const;

const DESKTOP_NAV = [
  { href: "/app/my-leads", label: "Minha fila" },
  { href: "/app/intelligence", label: "Inteligência" },
  { href: "/app/leads", label: "Leads" },
  { href: "/app/pipeline", label: "Pipeline" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: string): string {
  if (role === "ADMIN" || role === "MEMBER") {
    return roleLabels[role];
  }
  return role;
}

export function AppShell({ userName, userRole, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <Box minH="100vh" bg="bg.subtle" pb={{ base: "20", md: "0" }} overflowX="hidden">
      <Box
        as="header"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg"
        position="sticky"
        top="0"
        zIndex="docked"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Container maxW="containerList" py={{ base: "3", md: "4" }} px={{ base: "4", md: "6" }}>
          <Stack gap={{ base: "0", md: "3" }}>
            <HStack justify="space-between" align="center" gap="4" minH="touch">
              <Stack gap="0" minW="0">
                <Text fontSize="sm" fontWeight="semibold">
                  Prospecta
                </Text>
                <Text fontSize="xs" color="fg.muted" truncate>
                  {userName} · {roleLabel(userRole)}
                </Text>
              </Stack>
              <Box display={{ base: "none", md: "block" }}>
                <LogoutButton />
              </Box>
            </HStack>
            <HStack
              as="nav"
              gap="4"
              flexWrap="wrap"
              aria-label="Principal"
              display={{ base: "none", md: "flex" }}
            >
              {DESKTOP_NAV.map((item) => {
                const active = isActivePath(pathname, item.href);
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
                        minHeight: "44px",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      {item.label}
                    </NextLink>
                  </ChakraLink>
                );
              })}
              {userRole === "ADMIN" ? (
                <ChakraLink asChild>
                  <NextLink
                    href="/admin/users"
                    aria-current={
                      isActivePath(pathname, "/admin/users") ? "page" : undefined
                    }
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: isActivePath(pathname, "/admin/users")
                        ? 600
                        : 400,
                      textDecoration: isActivePath(pathname, "/admin/users")
                        ? "underline"
                        : "none",
                      textUnderlineOffset: "3px",
                      minHeight: "44px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    Usuários
                  </NextLink>
                </ChakraLink>
              ) : null}
            </HStack>
          </Stack>
        </Container>
      </Box>

      <Container
        as="div"
        maxW="containerList"
        px={{ base: "4", md: "6" }}
        py={{ base: "5", md: "8" }}
      >
        {children}
      </Container>

      <Box
        as="nav"
        aria-label="Principal mobile"
        display={{ base: "block", md: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        borderTopWidth="1px"
        borderColor="border"
        bg="bg"
        zIndex="docked"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <HStack justify="space-around" align="stretch" px="1" gap="0">
          {PRIMARY_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <ChakraLink
                asChild
                key={item.href}
                flex="1"
                _hover={{ textDecoration: "none" }}
              >
                <NextLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`mobile-nav-${item.href.split("/").pop()}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "56px",
                    fontSize: "0.7rem",
                    fontWeight: active ? 700 : 500,
                    opacity: active ? 1 : 0.7,
                    textAlign: "center",
                    padding: "0.35rem 0.25rem",
                  }}
                >
                  {item.label}
                </NextLink>
              </ChakraLink>
            );
          })}
        </HStack>
      </Box>
    </Box>
  );
}
