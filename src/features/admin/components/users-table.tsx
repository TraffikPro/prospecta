"use client";

import type { UserRole } from "@prisma/client";
import {
  Avatar,
  Card,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";

export type AdminUserCard = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

type UsersTableProps = {
  users: AdminUserCard[];
};

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
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>
      ))}
    </SimpleGrid>
  );
}
