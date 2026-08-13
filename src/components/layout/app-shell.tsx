"use client";

import type { ReactNode } from "react";

import {
  Box,
  Container,
  HStack,
  Link as ChakraLink,
  SkipNavContent,
  SkipNavLink,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  isNavPathActive,
  MOBILE_PRIMARY_NAV,
  profileRoleLabel,
  type NavAccess,
} from "@/components/navigation/nav-config";

type AppShellProps = {
  userName: string;
  userRole: string;
  canRunAcquisition?: boolean;
  children: ReactNode;
};

export function AppShell({
  userName,
  userRole,
  canRunAcquisition = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const access: NavAccess = { role: userRole, canRunAcquisition };

  return (
    <Box minH="100vh" bg="bg.subtle" overflowX="hidden">
      <SkipNavLink id="main-content" data-testid="skip-nav-link">
        Ir para o conteúdo
      </SkipNavLink>
      <Box display="flex" alignItems="stretch" minH="100vh">
        <AppSidebar
          userName={userName}
          userRole={userRole}
          access={access}
        />

        <Box flex="1" minW="0" pb={{ base: "20", md: "0" }}>
          <Box
            as="header"
            display={{ base: "block", md: "none" }}
            borderBottomWidth="1px"
            borderColor="border"
            bg="bg"
            position="sticky"
            top="0"
            zIndex="docked"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <HStack
              justify="space-between"
              align="center"
              gap="4"
              minH="touch"
              px="4"
              py="3"
            >
              <Stack gap="0" minW="0">
                <Text fontSize="sm" fontWeight="semibold">
                  Prospecta
                </Text>
                <Text fontSize="xs" color="fg.muted" truncate>
                  {userName} · {profileRoleLabel(userRole)}
                </Text>
              </Stack>
            </HStack>
          </Box>

          <SkipNavContent
            as="main"
            id="main-content"
            tabIndex={-1}
            style={{}}
            _focusVisible={{
              outlineWidth: "2px",
              outlineStyle: "solid",
              outlineColor: "blue.500",
              outlineOffset: "2px",
            }}
          >
            <Container
              as="div"
              maxW="containerList"
              px={{ base: "4", md: "6" }}
              py={{ base: "5", md: "8" }}
            >
              {children}
            </Container>
          </SkipNavContent>
        </Box>
      </Box>

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
          {MOBILE_PRIMARY_NAV.map((item) => {
            const active = isNavPathActive(pathname, item.href);
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
                  data-testid={item.testId}
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
