import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { runAbandonedCartReminders, runReleaseDayProcessing } from "@/data/automation";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [cartReminders, releaseDay] = await Promise.all([
    runAbandonedCartReminders(),
    runReleaseDayProcessing(),
  ]);

  return NextResponse.json({ cartReminders, releaseDay });
}
