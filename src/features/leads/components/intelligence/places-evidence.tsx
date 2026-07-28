"use client";

import { Link, Stack, Text } from "@chakra-ui/react";

type PlacesEvidenceProps = {
  rating?: number;
  reviews?: number;
  googleMapsUrl?: string;
};

function formatRating(rating: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

function formatReviews(reviews: number): string {
  const count = new Intl.NumberFormat("pt-BR").format(reviews);
  return reviews === 1 ? `${count} avaliação` : `${count} avaliações`;
}

/**
 * Verifiable Places facts that support the score — separate from signal chips.
 */
export function PlacesEvidence({
  rating,
  reviews,
  googleMapsUrl,
}: PlacesEvidenceProps) {
  const hasRating = typeof rating === "number";
  const hasReviews = typeof reviews === "number";
  const hasMaps = Boolean(googleMapsUrl);

  if (!hasRating && !hasReviews && !hasMaps) {
    return null;
  }

  return (
    <Stack gap="2" data-testid="intelligence-places-evidence">
      <Text fontSize="sm" fontWeight="semibold">
        Evidências no Google
      </Text>
      <Stack gap="1.5">
        {hasRating ? (
          <Text fontSize="sm" data-testid="intelligence-rating">
            {formatRating(rating)} de 5
          </Text>
        ) : null}
        {hasReviews ? (
          <Text fontSize="sm" data-testid="intelligence-reviews">
            {formatReviews(reviews)}
          </Text>
        ) : null}
        {hasMaps && googleMapsUrl ? (
          <Link
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            fontSize="sm"
            fontWeight="medium"
            color="fg"
            textDecoration="underline"
            textUnderlineOffset="3px"
            data-testid="intelligence-google-maps-link"
          >
            Ver no Google Maps
          </Link>
        ) : null}
      </Stack>
    </Stack>
  );
}
