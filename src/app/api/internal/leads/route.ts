import { NextResponse } from "next/server";
import {
  LeadDuplicateError,
  LeadValidationError,
} from "@/features/leads/lead.errors";
import { authorizeImportRequest } from "@/server/auth/import-token";
import { ingestExternalLead } from "@/server/services/lead.service";

export async function POST(request: Request) {
  if (!authorizeImportRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await ingestExternalLead(body);
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
}
