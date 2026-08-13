"use client";

import { useActionState } from "react";

import type { UserRole } from "@prisma/client";
import {
  Avatar,
  Card,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { DEFAULT_WEEKLY_TARGET } from "@/features/portfolio/portfolio.rules";
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

export type AdminUserCard = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  canRunAcquisition: boolean;
  weeklyTarget: number | null;
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
      <Text fontSize="xs" color="fg.muted">
        Aquisição: incluída no papel Admin
      </Text>
    );
  }

  return (
    <Stack gap="1">
      <HStack gap="2" flexWrap="wrap" align="center">
        <Text fontSize="xs" color="fg.muted">
          Aquisição: {user.canRunAcquisition ? "autorizado" : "bloqueado"}
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
            size="xs"
            variant="outline"
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
  const current = user.weeklyTarget ?? DEFAULT_WEEKLY_TARGET;

  return (
    <form action={formAction}>
      <Stack gap="1">
        <Text fontSize="xs" color="fg.muted">
          Meta semanal (HIGH)
        </Text>
        <HStack gap="2" flexWrap="wrap" align="center">
          <input type="hidden" name="userId" value={user.id} />
          <input
            type="number"
            name="weeklyTarget"
            min={1}
            max={50}
            defaultValue={current}
            disabled={pending}
            style={{ minHeight: 36, width: 72, padding: "0.25rem 0.5rem" }}
            aria-label={`Meta semanal de ${user.name}`}
          />
          <Button
            type="submit"
            size="xs"
            variant="outline"
            loading={pending}
            disabled={pending}
          >
            Salvar meta
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

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Nenhum usuário cadastrado
      </Text>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" data-testid="admin-users">
      {users.map((user) => (
        <Card.Root key={user.id} variant="outline" borderRadius="card">
          <Card.Body>
            <Stack direction="row" gap="3" align="flex-start">
              <Avatar.Root size="md">
                <Avatar.Fallback name={user.name} />
              </Avatar.Root>
              <Stack gap="2" flex="1" minW="0">
                <Heading as="h2" size="sm" fontWeight="semibold" truncate>
                  {user.name}
                </Heading>
                <Text fontSize="sm" color="fg.muted" truncate>
                  {user.email}
                </Text>
                <Stack direction="row" gap="2" flexWrap="wrap">
                  <RoleBadge role={user.role} />
                  <StatusBadge isActive={user.isActive} />
                </Stack>
                <AcquisitionPermissionControls user={user} />
                <WeeklyQuotaControls user={user} />
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>
      ))}
    </SimpleGrid>
  );
}
