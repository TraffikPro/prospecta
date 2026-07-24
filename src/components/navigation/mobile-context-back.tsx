import { Link as ChakraLink, Text } from "@chakra-ui/react";
import NextLink from "next/link";

type MobileContextBackProps = {
  href: string;
  label: string;
};

export function MobileContextBack({ href, label }: MobileContextBackProps) {
  return (
    <ChakraLink
      asChild
      fontSize="sm"
      minH="11"
      display="inline-flex"
      alignItems="center"
      maxW="full"
      data-testid="mobile-context-back"
    >
      <NextLink href={href} title={label}>
        <Text as="span" truncate>
          ← {label}
        </Text>
      </NextLink>
    </ChakraLink>
  );
}
