import { generateRecommendation } from "@/lib/ai";
import { ok, badRequest, notFound, serverError } from "@/lib/http";
import {
  getBusinesses,
  getServiceRequest,
  getSnapshot,
  getSummaries,
  saveRecommendation
} from "@/lib/store";
import { recommendationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = recommendationSchema.parse(await request.json());
    const serviceRequest = await getServiceRequest(input.requestId);

    if (!serviceRequest) {
      return notFound("Service request not found.");
    }

    const businesses = await getBusinesses(serviceRequest.id);
    const summaries = await getSummaries(serviceRequest.id);

    if (!summaries.length) {
      return badRequest(new Error("Run at least one call before generating a recommendation."));
    }

    const recommendation = await generateRecommendation({
      request: serviceRequest,
      businesses,
      summaries
    });
    await saveRecommendation(recommendation);

    const snapshot = await getSnapshot(serviceRequest.id);
    return ok({ snapshot });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return badRequest(error);
    }
    return serverError(error);
  }
}
