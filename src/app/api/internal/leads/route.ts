import { NextResponse } from "next/server";
import {
  LeadDuplicateError,
  LeadValidationError,
} from "@/features/leads/lead.errors";
import { authorizeImportRequest } from "@/server/auth/import-token";
import {
  enforceRateLimits,
  RATE_LIMIT_POLICIES,
  routeHandlerRateLimitResponse,
} from "@/server/rate-limit";
import { ingestExternalLead } from "@/server/services/lead.service";

type LeadPostDependencies = {
  authorize?: typeof authorizeImportRequest;
  enforce?: typeof enforceRateLimits;
  ingest?: typeof ingestExternalLead;
};

export function createLeadPostHandler(
  dependencies: LeadPostDependencies = {},
): (request: Request) => Promise<NextResponse> {
  return async function leadPostHandler(request: Request) {
    if (!(dependencies.authorize ?? authorizeImportRequest)(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitResponse = routeHandlerRateLimitResponse(
      await (dependencies.enforce ?? enforceRateLimits)([
        {
          policy: RATE_LIMIT_POLICIES.importClient,
          // V1 has one credential per integration, so this bucket is shared.
          // Multiple clients must use a post-auth HMAC identity in the future;
          // the raw Bearer must never become a key or log field.
          identity: "lead-generator",
        },
      ]),
    );
    if (limitResponse) return limitResponse;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    try {
      const result = await (dependencies.ingest ?? ingestExternalLead)(body);
      return NextResponse.json(
        {
          id: result.id,
          created: result.created,
          stage: result.stage,
        },
        { status: result.created ? 201 : 200 },
      );
    } catch (error) {
      if (error instanceof LeadValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof LeadDuplicateError) {
        return NextResponse.json(
          {
            error: "DUPLICATE_LEAD",
            existingLeadId: error.existingLeadId,
          },
          { status: 409 },
        );
      }
      throw error;
    }
  };
}

export const POST = createLeadPostHandler();
