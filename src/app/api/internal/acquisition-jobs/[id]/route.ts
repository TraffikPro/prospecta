import { NextResponse } from "next/server";

import { authorizeAcquisitionJobRequest } from "@/server/auth/acquisition-job-token";
import { findAcquisitionJobById } from "@/server/repositories/acquisition-job.repository";
import {
  enforceRateLimits,
  RATE_LIMIT_POLICIES,
  routeHandlerRateLimitResponse,
} from "@/server/rate-limit";
import {
  AcquisitionConflictError,
  AcquisitionValidationError,
  applyAcquisitionJobCallback,
} from "@/server/services/acquisition-job.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AcquisitionJobRouteDependencies = {
  authorize?: typeof authorizeAcquisitionJobRequest;
  enforce?: typeof enforceRateLimits;
  findJob?: typeof findAcquisitionJobById;
  applyCallback?: typeof applyAcquisitionJobCallback;
};

export function createAcquisitionJobHandlers(
  dependencies: AcquisitionJobRouteDependencies = {},
) {
  async function getHandler(request: Request, context: RouteContext) {
    if (!(dependencies.authorize ?? authorizeAcquisitionJobRequest)(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitResponse = routeHandlerRateLimitResponse(
      await (dependencies.enforce ?? enforceRateLimits)([
        {
          policy: RATE_LIMIT_POLICIES.acquisitionGetClient,
          // Shared while V1 has one validated integration credential. Future
          // clients need a post-auth HMAC identity, never the raw Bearer.
          identity: "acquisition-runner",
        },
      ]),
    );
    if (limitResponse) return limitResponse;

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    const job = await (dependencies.findJob ?? findAcquisitionJobById)(id);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      fingerprint: job.fingerprint,
      requestedById: job.requestedById,
      purpose: job.purpose,
      requestedSlots: job.requestedSlots,
      limit: job.limit,
    });
  }

  async function patchHandler(request: Request, context: RouteContext) {
    if (!(dependencies.authorize ?? authorizeAcquisitionJobRequest)(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    const limitResponse = routeHandlerRateLimitResponse(
      await (dependencies.enforce ?? enforceRateLimits)([
        {
          policy: RATE_LIMIT_POLICIES.acquisitionPatchClient,
          // Shared while V1 has one validated integration credential. Future
          // clients need a post-auth HMAC identity, never the raw Bearer.
          identity: "acquisition-runner",
        },
        {
          policy: RATE_LIMIT_POLICIES.acquisitionPatchJob,
          identity: id,
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
      const result = await (
        dependencies.applyCallback ?? applyAcquisitionJobCallback
      )(id, body);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AcquisitionValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof AcquisitionConflictError) {
        return NextResponse.json(
          { error: error.message, existingJobId: error.existingJobId },
          { status: 409 },
        );
      }
      throw error;
    }
  }

  return { GET: getHandler, PATCH: patchHandler };
}

const handlers = createAcquisitionJobHandlers();
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
