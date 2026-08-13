"use client";

import { useState } from "react";

import {
  Avatar,
  Box,
  Button,
  HStack,
  IconButton,
  Link as ChakraLink,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/server/actions/auth";
import { Tooltip } from "@/components/ui/tooltip";

import {
  isNavPathActive,
  profileRoleLabel,
  visibleNavGroups,
  type NavAccess,
} from "@/components/navigation/nav-config";
import { CollapseIcon, NavIcon } from "@/components/navigation/nav-icons";

type AppSidebarProps = {
  userName: string;
  userRole: string;
  access: NavAccess;
};

export function AppSidebar({ userName, userRole, access }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const groups = visibleNavGroups(access);

  function toggleCollapsed() {
    setCollapsed((current) => !current);
  }

  return (
    <Box
      as="aside"
      display={{ base: "none", md: "flex" }}
      flexDir="column"
      w={collapsed ? "sidebarCollapsed" : "sidebarExpanded"}
      minW={collapsed ? "sidebarCollapsed" : "sidebarExpanded"}
      h="100vh"
      position="sticky"
      top="0"
      borderRightWidth="1px"
      borderColor="border"
      bg="bg"
      px={collapsed ? "2" : "3"}
      py="4"
      gap="4"
      transition="width 0.15s ease, min-width 0.15s ease"
      data-testid="desktop-sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      {collapsed ? (
        <Stack align="center" gap="1">
          <Text fontWeight="semibold" fontSize="sm" aria-label="Prospecta">
            P
          </Text>
          <IconButton
            aria-label="Expandir menu"
            aria-expanded={false}
            size="xs"
            variant="ghost"
            colorPalette="gray"
            onClick={toggleCollapsed}
            data-testid="sidebar-collapse"
          >
            <CollapseIcon expanded={false} />
          </IconButton>
        </Stack>
      ) : (
        <HStack justify="space-between" gap="2">
          <Text fontWeight="semibold" fontSize="sm" truncate>
            Prospecta
          </Text>
          <IconButton
            aria-label="Recolher menu"
            aria-expanded={true}
            size="xs"
            variant="ghost"
            colorPalette="gray"
            onClick={toggleCollapsed}
            data-testid="sidebar-collapse"
          >
            <CollapseIcon expanded={true} />
          </IconButton>
        </HStack>
      )}

      <Stack
        as="nav"
        aria-label="Principal"
        gap="4"
        flex="1"
        overflowY="auto"
        overflowX="hidden"
      >
        {groups.map((group) => (
          <Stack key={group.id} gap="1">
            {group.label && !collapsed ? (
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="0.04em"
                px="2"
                pt="1"
              >
                {group.label}
              </Text>
            ) : null}
            {group.items.map((item) => {
              const active = isNavPathActive(pathname, item.href, item.match);
              const link = (
                <ChakraLink
                  asChild
                  display="flex"
                  alignItems="center"
                  justifyContent={collapsed ? "center" : "flex-start"}
                  gap={collapsed ? "0" : "2.5"}
                  minH="touch"
                  px={collapsed ? "0" : "2"}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight={active ? "semibold" : "medium"}
                  bg={active ? "bg.muted" : "transparent"}
                  _hover={{ textDecoration: "none", bg: "bg.muted" }}
                >
                  <NextLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    data-testid={item.testId}
                  >
                    <NavIcon id={item.icon} />
                    {collapsed ? null : item.label}
                  </NextLink>
                </ChakraLink>
              );

              if (!collapsed) {
                return <Box key={item.href}>{link}</Box>;
              }

              return (
                <Tooltip
                  key={item.href}
                  content={item.label}
                  positioning={{ placement: "right" }}
                >
                  <Box display="block">{link}</Box>
                </Tooltip>
              );
            })}
          </Stack>
        ))}
      </Stack>

      <Menu.Root positioning={{ placement: "top-start" }}>
        <Menu.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            colorPalette="gray"
            w="full"
            minH="touch"
            borderRadius="md"
            px={collapsed ? "0" : "2"}
            py="2"
            justifyContent={collapsed ? "center" : "flex-start"}
            gap="3"
            h="auto"
            data-testid="nav-profile-trigger"
            aria-label={`Conta de ${userName}`}
          >
            <Avatar.Root size="sm">
              <Avatar.Fallback name={userName} />
            </Avatar.Root>
            {collapsed ? null : (
              <Stack gap="0" align="flex-start" minW="0" flex="1">
                <Text fontSize="sm" fontWeight="medium" truncate w="full">
                  {userName}
                </Text>
                <Text fontSize="xs" color="fg.muted" truncate w="full">
                  {profileRoleLabel(userRole)}
                </Text>
              </Stack>
            )}
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="44">
              <form action={logoutAction}>
                <Menu.Item value="logout" asChild>
                  <button type="submit">Sair</button>
                </Menu.Item>
              </form>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Box>
  );
}
