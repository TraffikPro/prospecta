import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/server/auth/cron-secret";
import { closeExpiredWeeklyPortfolios } from "@/server/services/weekly-close.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await closeExpiredWeeklyPortfolios();
  return NextResponse.json(result);
}
