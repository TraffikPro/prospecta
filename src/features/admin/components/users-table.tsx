"use client";

import { useActionState } from "react";

import type { UserRole } from "@prisma/client";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { SUGGESTED_WEEKLY_TARGET } from "@/features/portfolio/portfolio.rules";
import {
  setWeeklyQuotaAction,
  type PortfolioActionState,
} from "@/server/actions/portfolio";
import {
  setAcquisitionPermissionAction,
  type SetAcquisitionPermissionState,
} from "@/server/actions/user-permissions";

import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";
import {
  formatOpenOwnedLeads,
  formatTeamMemberCount,
} from "@/features/admin/team-presentation";

export type AdminUserCard = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  canRunAcquisition: boolean;
  weeklyTarget: number | null;
  openOwnedLeads: number;
};

type UsersTableProps = {
  users: AdminUserCard[];
};

const acquisitionInitial: SetAcquisitionPermissionState = {};
const quotaInitial: PortfolioActionState = {};

function AcquisitionPermissionControls({ user }: { user: AdminUserCard }) {
  const [state, formAction, pending] = useActionState(
    setAcquisitionPermissionAction,
    acquisitionInitial,
  );

  if (user.role === "ADMIN") {
    return (
      <Text fontSize="xs" color="fg.muted" data-testid="admin-user-acquisition">
        Aquisição: incluída no papel Admin
      </Text>
    );
  }

  return (
    <Stack gap="1" data-testid="admin-user-acquisition">
      <HStack gap="2" flexWrap="wrap" align="center">
        <Text fontSize="xs" color="fg.muted">
          {user.canRunAcquisition ? "Aquisição autorizada" : "Aquisição bloqueada"}
        </Text>
        <form action={formAction}>
          <input type="hidden" name="userId" value={user.id} />
          <input
            type="hidden"
            name="canRunAcquisition"
            value={user.canRunAcquisition ? "false" : "true"}
          />
          <Button
            type="submit"
            size="sm"
            minH="touch"
            variant="outline"
            colorPalette="gray"
            loading={pending}
            disabled={pending}
          >
            {user.canRunAcquisition ? "Revogar" : "Autorizar"}
          </Button>
        </form>
      </HStack>
      {state.error ? (
        <Text fontSize="xs" color="fg.error" role="alert">
          {state.error}
        </Text>
      ) : null}
    </Stack>
  );
}

function WeeklyQuotaControls({ user }: { user: AdminUserCard }) {
  const [state, formAction, pending] = useActionState(
    setWeeklyQuotaAction,
    quotaInitial,
  );
  const formDefault = user.weeklyTarget ?? SUGGESTED_WEEKLY_TARGET;

  return (
    <form action={formAction} data-testid="admin-user-quota">
      <Stack gap="1">
        <Text fontSize="xs" color="fg.muted">
          Meta semanal (HIGH)
          {user.weeklyTarget == null ? " — não configurada" : ""}
        </Text>
        <HStack gap="2" flexWrap="wrap" align="center">
          <input type="hidden" name="userId" value={user.id} />
          <Input
            type="number"
            name="weeklyTarget"
            min={1}
            max={50}
            defaultValue={formDefault}
            disabled={pending}
            w="20"
            minH="touch"
            size="sm"
            aria-label={`Meta semanal de ${user.name}`}
          />
          <Button
            type="submit"
            size="sm"
            minH="touch"
            variant="outline"
            colorPalette="gray"
            loading={pending}
            disabled={pending}
          >
            Salvar
          </Button>
        </HStack>
        {state.error ? (
          <Text fontSize="xs" color="fg.error" role="alert">
            {state.error}
          </Text>
        ) : null}
        {state.ok ? (
          <Text fontSize="xs" color="fg.muted">
            Meta atualizada.
          </Text>
        ) : null}
      </Stack>
    </form>
  );
}

function MobileMemberRow({ user }: { user: AdminUserCard }) {
  return (
    <Box
      as="article"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      px="3"
      py="3"
      data-testid="admin-user-row"
      data-user-id={user.id}
      data-role={user.role}
    >
      <Stack gap="3">
        <Stack gap="1" minW={0}>
          <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
            {user.name}
          </Text>
          <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere">
            {user.email}
          </Text>
          <HStack gap="2" flexWrap="wrap" align="center">
            <RoleBadge role={user.role} />
            <StatusBadge isActive={user.isActive} />
          </HStack>
          <Text fontSize="xs" color="fg.muted" data-testid="admin-user-open-leads">
            {formatOpenOwnedLeads(user.openOwnedLeads)}
          </Text>
        </Stack>
        <AcquisitionPermissionControls user={user} />
        <WeeklyQuotaControls user={user} />
      </Stack>
    </Box>
  );
}

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <AppEmptyState
        data-testid="admin-users-empty"
        title="Nenhum usuário cadastrado"
        description="Contas operacionais são provisionadas pelo seed ou pelo administrador do ambiente — não há convite nesta tela."
      />
    );
  }

  return (
    <Stack gap="4" data-testid="admin-users">
      <Text fontSize="sm" color="fg.muted" data-testid="admin-users-count">
        {formatTeamMemberCount(users.length)}
      </Text>

      <Stack
        gap="2"
        display={{ base: "flex", md: "none" }}
        data-testid="admin-users-mobile"
      >
        {users.map((user) => (
          <MobileMemberRow key={user.id} user={user} />
        ))}
      </Stack>

      <Box display={{ base: "none", md: "block" }} overflowX="auto">
        <Table.Root data-testid="admin-users-table">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Pessoa</Table.ColumnHeader>
              <Table.ColumnHeader>Papel</Table.ColumnHeader>
              <Table.ColumnHeader hideBelow="lg">Status</Table.ColumnHeader>
              <Table.ColumnHeader>Leads abertos</Table.ColumnHeader>
              <Table.ColumnHeader>Aquisição</Table.ColumnHeader>
              <Table.ColumnHeader>Meta semanal</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row
                key={user.id}
                _hover={{ bg: "bg.subtle" }}
                data-testid="admin-user-row"
                data-user-id={user.id}
                data-role={user.role}
              >
                <Table.Cell minW="0">
                  <Stack gap="0" minW="0">
                    <Text fontWeight="medium" fontSize="sm" lineClamp={1}>
                      {user.name}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      overflowWrap="anywhere"
                    >
                      {user.email}
                    </Text>
                  </Stack>
                </Table.Cell>
                <Table.Cell>
                  <RoleBadge role={user.role} />
                </Table.Cell>
                <Table.Cell hideBelow="lg">
                  <StatusBadge isActive={user.isActive} />
                </Table.Cell>
                <Table.Cell>
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    whiteSpace="nowrap"
                    data-testid="admin-user-open-leads"
                  >
                    {user.openOwnedLeads}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <AcquisitionPermissionControls user={user} />
                </Table.Cell>
                <Table.Cell>
                  <WeeklyQuotaControls user={user} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  );
}
