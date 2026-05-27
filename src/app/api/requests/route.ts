import { generateCallPlan } from "@/lib/ai";
import { ok, badRequest, serverError } from "@/lib/http";
import { createServiceRequest, getSnapshot } from "@/lib/store";
import { intakeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = intakeSchema.parse(await request.json());
    const callPlan = await generateCallPlan(input);
    const serviceRequest = await createServiceRequest({ ...input, callPlan });
    const snapshot = await getSnapshot(serviceRequest.id);

    return ok({ snapshot });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return badRequest(error);
    }
    return serverError(error);
  }
}
