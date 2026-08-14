import Link from "next/link";
import { redirect } from "next/navigation";
import { HStack, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading, SectionHeading } from "@/components/layout/page-heading";
import {
  ContextualNav,
  morePageSections,
  profileRoleLabel,
} from "@/components/navigation";
import { NavBadge } from "@/components/navigation/nav-badge";
import { LogoutButton } from "@/features/auth/logout-button";
import {
  badgeCountForNavItem,
  navItemAccessibleName,
} from "@/features/navigation/nav-badge.format";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import {
  EMPTY_NAV_BADGES,
  getNavigationBadgesCached,
} from "@/server/navigation/get-navigation-badges";

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
  let badges = EMPTY_NAV_BADGES;
  try {
    badges = await getNavigationBadgesCached({ actorId: user.id });
  } catch {
    console.error("Failed to load navigation badges");
  }

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
            {section.items.map((item) => {
              const count = badgeCountForNavItem(item.id, badges);
              const accessibleName = navItemAccessibleName(
                item.label,
                item.id,
                count,
              );
              return (
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
                        : item.id === "high-pool"
                          ? "more-nav-high-pool"
                          : undefined
                  }
                >
                  <Link
                    href={item.href}
                    aria-label={count > 0 ? accessibleName : undefined}
                  >
                    <HStack w="full" justify="space-between" gap="3">
                      <Text as="span">{item.label}</Text>
                      <NavBadge count={count} itemId={item.id} />
                    </HStack>
                  </Link>
                </ChakraLink>
              );
            })}
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
