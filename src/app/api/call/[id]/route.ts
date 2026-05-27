import { getCallRecord } from "@/lib/call-store";
import { notFound, ok, serverError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const call = getCallRecord(id);

    if (!call) {
      return notFound("Call not found.");
    }

    return ok({ call });
  } catch (error) {
    return serverError(error);
  }
}
