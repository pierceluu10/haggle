import type { BusinessLead } from "@/lib/types";
import { ok, badRequest, notFound, serverError } from "@/lib/http";
import { getServiceRequest, getSnapshot, saveBusinesses } from "@/lib/store";
import { approveBusinessesSchema } from "@/lib/validation";
import { createId, isValidPhoneNumber, normalizePhoneNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = approveBusinessesSchema.parse(await request.json());
    const serviceRequest = await getServiceRequest(input.requestId);

    if (!serviceRequest) {
      return notFound("Service request not found.");
    }

    const businesses: BusinessLead[] = input.businesses.map((business) => {
      const phone = normalizePhoneNumber(business.phone);
      if (!isValidPhoneNumber(phone)) {
        throw new Error(`${business.name} needs an E.164 phone number before calling.`);
      }

      return {
        id: business.id || createId("biz"),
        requestId: serviceRequest.id,
        name: business.name,
        phone,
        address: business.address,
        website: business.website || undefined,
        contactName: business.contactName || undefined,
        rating: business.rating,
        source: business.source,
        selected: business.selected,
        notes: business.notes || ""
      };
    });

    await saveBusinesses(serviceRequest.id, businesses);
    const snapshot = await getSnapshot(serviceRequest.id);

    return ok({ snapshot });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return badRequest(error);
    }
    return badRequest(error);
  }
}
