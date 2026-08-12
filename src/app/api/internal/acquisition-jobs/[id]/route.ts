import { NextResponse } from "next/server";

import { authorizeAcquisitionJobRequest } from "@/server/auth/acquisition-job-token";
import { findAcquisitionJobById } from "@/server/repositories/acquisition-job.repository";
import {
  AcquisitionConflictError,
  AcquisitionValidationError,
  applyAcquisitionJobCallback,
} from "@/server/services/acquisition-job.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  if (!authorizeAcquisitionJobRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  const job = await findAcquisitionJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    fingerprint: job.fingerprint,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!authorizeAcquisitionJobRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await applyAcquisitionJobCallback(id, body);
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
