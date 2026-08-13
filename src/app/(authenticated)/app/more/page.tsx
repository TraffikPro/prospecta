import Link from "next/link";
import { redirect } from "next/navigation";
import { Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading, SectionHeading } from "@/components/layout/page-heading";
import {
  ContextualNav,
  morePageSections,
  profileRoleLabel,
} from "@/components/navigation";
import { LogoutButton } from "@/features/auth/logout-button";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

export default async function MorePage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const user = sessionUser!;
  const sections = morePageSections({
    role: user.role,
    canRunAcquisition: user.canRunAcquisition,
  });

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Mais" }]} />
      <PageHeading title="Mais" meta="Atalhos fora da operação diária." />

      {sections.map((section) => (
        <Stack key={section.id} gap="3">
          {section.label ? (
            <SectionHeading>{section.label}</SectionHeading>
          ) : null}
          <Stack gap="1">
            {section.items.map((item) => (
              <ChakraLink
                asChild
                key={item.href}
                textDecoration="underline"
                minH="touch"
                display="flex"
                alignItems="center"
                data-testid={
                  item.id === "acquisition"
                    ? "more-nav-acquisition"
                    : item.id === "team"
                      ? "more-nav-admin-users"
                      : undefined
                }
              >
                <Link href={item.href}>{item.label}</Link>
              </ChakraLink>
            ))}
          </Stack>
        </Stack>
      ))}

      <Stack gap="3">
        <SectionHeading>Conta</SectionHeading>
        <Text textStyle="meta">
          {user.name} · {profileRoleLabel(user.role)}
        </Text>
        <LogoutButton />
      </Stack>
    </PageFrame>
  );
}
