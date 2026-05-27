import type { BusinessLead, ServiceRequest } from "@/lib/types";
import { createId, normalizePhoneNumber, shouldUseLivePlaces } from "@/lib/utils";
import { buildDemoBusinesses } from "@/lib/demo-data";

type GooglePlace = {
  displayName?: { text?: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  websiteUri?: string;
  rating?: number;
};

export async function searchBusinesses(request: ServiceRequest): Promise<BusinessLead[]> {
  if (!shouldUseLivePlaces()) {
    return buildDemoBusinesses(request.id);
  }

  const query = `${request.serviceType} near ${request.location}`;
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY || "",
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating"
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 8,
      languageCode: "en",
      regionCode: "CA"
    })
  });

  if (!response.ok) {
    throw new Error(`Google Places search failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };

  return (payload.places ?? [])
    .filter((place) => place.internationalPhoneNumber || place.nationalPhoneNumber)
    .slice(0, 8)
    .map((place) => ({
      id: createId("biz"),
      requestId: request.id,
      name: place.displayName?.text || "Unnamed business",
      phone: normalizePhoneNumber(place.internationalPhoneNumber || place.nationalPhoneNumber || ""),
      address: place.formattedAddress || "",
      website: place.websiteUri,
      rating: place.rating,
      source: "google_places",
      selected: true,
      notes: ""
    }));
}
