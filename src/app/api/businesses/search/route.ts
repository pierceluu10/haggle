import { ok, badRequest, notFound, serverError } from "@/lib/http";
import { searchBusinesses } from "@/lib/places";
import { getServiceRequest, updateRequestStatus } from "@/lib/store";
import { searchBusinessesSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = searchBusinessesSchema.parse(await request.json());
    const serviceRequest = await getServiceRequest(input.requestId);

    if (!serviceRequest) {
      return notFound("Service request not found.");
    }

    const businesses = await searchBusinesses(serviceRequest);
    await updateRequestStatus(serviceRequest.id, "businesses_found");

    return ok({ businesses });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return badRequest(error);
    }
    return serverError(error);
  }
}
