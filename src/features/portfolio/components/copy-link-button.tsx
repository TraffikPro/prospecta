"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { toAbsolutePortfolioUrl } from "../portfolio-url";

type CopyLinkButtonProps = {
  url: string;
  label?: string;
};

export function CopyLinkButton({
  url,
  label = "Copiar link",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const absolute = toAbsolutePortfolioUrl(url, {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      origin: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      size="md"
      minH="touch"
      variant="outline"
      colorPalette="gray"
      flex="1"
      onClick={handleCopy}
      data-testid="portfolio-copy-link"
      aria-live="polite"
    >
      {copied ? "Link copiado" : label}
    </Button>
  );
}
