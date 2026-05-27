import { z } from "zod";

export const intakeSchema = z.object({
  description: z.string().trim().min(8, "Describe the job in a little more detail."),
  serviceType: z.string().trim().min(2, "Service type is required."),
  location: z.string().trim().min(2, "Location is required."),
  budget: z.string().trim().min(1, "Budget is required."),
  timeline: z.string().trim().min(2, "Timeline is required."),
  preferences: z.string().trim().default(""),
  dealbreakers: z.string().trim().default(""),
  urgency: z.enum(["low", "normal", "urgent"]).default("normal")
});

export const businessLeadInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Business name is required."),
  phone: z.string().trim().min(7, "Phone number is required."),
  address: z.string().trim().default(""),
  website: z.string().trim().optional().or(z.literal("")),
  contactName: z.string().trim().optional().or(z.literal("")),
  rating: z.number().optional(),
  source: z.enum(["google_places", "manual", "demo"]).default("manual"),
  selected: z.boolean().default(true),
  notes: z.string().trim().optional().or(z.literal(""))
});

export const approveBusinessesSchema = z.object({
  requestId: z.string().min(1),
  businesses: z.array(businessLeadInputSchema).min(1)
});

export const searchBusinessesSchema = z.object({
  requestId: z.string().min(1)
});

export const callRequestSchema = z.object({
  requestId: z.string().min(1),
  purpose: z.enum(["inquiry", "negotiation"]),
  businessIds: z.array(z.string().min(1)).min(1),
  negotiation: z
    .object({
      targetPrice: z.string().trim().min(1),
      maxPrice: z.string().trim().min(1),
      strategy: z.enum(["lowest_price", "fastest_availability", "best_value"]),
      notes: z.string().trim().default("")
    })
    .optional()
});

export const recommendationSchema = z.object({
  requestId: z.string().min(1)
});

export type ValidationError = {
  field: string;
  message: string;
};

export function flattenZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "form",
    message: issue.message
  }));
}
