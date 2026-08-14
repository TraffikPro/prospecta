import { Stack, Text } from "@chakra-ui/react";

type KpiStatCardProps = {
  title: string;
  value: string;
  hint: string;
  emphasized?: boolean;
  "data-testid"?: string;
};

export function KpiStatCard({
  title,
  value,
  hint,
  emphasized = false,
  "data-testid": testId,
}: KpiStatCardProps) {
  return (
    <Stack
      as="article"
      gap="1"
      borderWidth="1px"
      borderColor={emphasized ? "brand.solid" : "border"}
      borderRadius="card"
      bg="bg"
      p="4"
      minW="0"
      data-testid={testId}
    >
      <Text as="h3" fontSize="xs" fontWeight="medium" color="fg.muted">
        {title}
      </Text>
      <Text fontSize="2xl" fontWeight={emphasized ? "bold" : "semibold"} lineHeight="1.2">
        {value}
      </Text>
      <Text textStyle="meta">{hint}</Text>
    </Stack>
  );
}
