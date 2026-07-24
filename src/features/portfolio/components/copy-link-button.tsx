"use client";

import { Clipboard } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

import { toAbsolutePortfolioUrl } from "../portfolio-url";

type CopyLinkButtonProps = {
  url: string;
  label?: string;
};

function absoluteCopyValue(url: string): string {
  return toAbsolutePortfolioUrl(url, {
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
  });
}

export function CopyLinkButton({
  url,
  label = "Copiar link",
}: CopyLinkButtonProps) {
  const value = absoluteCopyValue(url);

  return (
    <Clipboard.Root value={value}>
      <Clipboard.Trigger asChild>
        <Button
          type="button"
          size="md"
          minH="touch"
          variant="outline"
          colorPalette="gray"
          flex="1"
          data-testid="portfolio-copy-link"
        >
          <Clipboard.Indicator copied="Link copiado">{label}</Clipboard.Indicator>
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}
