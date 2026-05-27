"use client";

import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  Clock,
  FileText,
  HandCoins,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type {
  AppSnapshot,
  BusinessLead,
  CallPurpose,
  IntakeInput,
  Recommendation
} from "@/lib/types";
import { demoIntake } from "@/lib/demo-data";

type ApiError = {
  errors?: Array<{ field: string; message: string }>;
};

type LoadingKey =
  | "request"
  | "search"
  | "approve"
  | "inquiry"
  | "recommendation"
  | "negotiation";

const initialIntake: IntakeInput = demoIntake();

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as T & ApiError;

  if (!response.ok) {
    const message = payload.errors?.map((error) => error.message).join(" ") || "Request failed.";
    throw new Error(message);
  }

  return payload;
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "h-11 rounded-md border border-ink/15 bg-white px-3 text-sm outline-none transition focus:border-fern focus:ring-4 focus:ring-fern/10",
        props.className
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "min-h-24 resize-y rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-fern focus:ring-4 focus:ring-fern/10",
        props.className
      )}
    />
  );
}

function PrimaryButton({
  children,
  className,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 disabled:bg-ink/35",
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  className,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold text-ink transition hover:border-fern hover:text-fern disabled:opacity-45",
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={clsx(
        "grid h-9 w-9 place-items-center rounded-md border border-ink/15 bg-white text-ink transition hover:border-coral hover:text-coral disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-ink/10 bg-white px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink/70">
      {children}
    </span>
  );
}

function formatMoney(summary: AppSnapshot["summaries"][number]): string {
  if (summary.priceMin && summary.priceMax && summary.priceMin !== summary.priceMax) {
    return `$${summary.priceMin}-$${summary.priceMax}`;
  }
  if (summary.priceMin || summary.priceMax) {
    return `$${summary.priceMin || summary.priceMax}`;
  }
  return summary.priceText;
}

export default function Home() {
  const [intake, setIntake] = useState<IntakeInput>(initialIntake);
  const [snapshot, setSnapshot] = useState<AppSnapshot>({ businesses: [], calls: [], summaries: [] });
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState<LoadingKey | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedNegotiationIds, setSelectedNegotiationIds] = useState<string[]>([]);
  const [negotiation, setNegotiation] = useState({
    targetPrice: "$250",
    maxPrice: "$350",
    strategy: "best_value" as const,
    notes: "Ask for a lower call-out fee or an earlier appointment, but do not book anything."
  });

  const selectedLeadCount = leads.filter((lead) => lead.selected).length;
  const approvedBusinesses = snapshot.businesses.filter((business) => business.selected);
  const completedSummaries = snapshot.summaries.filter((summary) => summary.outcome === "quote_collected");
  const recommendation: Recommendation | undefined = snapshot.recommendation;

  const bestBusiness = useMemo(
    () => snapshot.businesses.find((business) => business.id === recommendation?.bestBusinessId),
    [recommendation?.bestBusinessId, snapshot.businesses]
  );

  const callStatusByBusiness = useMemo(() => {
    const map = new Map<string, string>();
    for (const call of snapshot.calls) {
      map.set(call.businessId, call.status);
    }
    return map;
  }, [snapshot.calls]);
  const statusItems: Array<[string, string | number, LucideIcon]> = [
    ["Request", snapshot.request ? "done" : "waiting", FileText],
    ["Leads", leads.length || snapshot.businesses.length || "waiting", MapPin],
    ["Calls", snapshot.calls.length || "waiting", Phone],
    ["Quotes", completedSummaries.length || "waiting", BadgeCheck]
  ];

  async function run<T>(key: LoadingKey, action: () => Promise<T>): Promise<T | undefined> {
    setError("");
    setLoading(key);
    try {
      return await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return undefined;
    } finally {
      setLoading(null);
    }
  }

  async function createRequest() {
    await run("request", async () => {
      const response = await postJson<{ snapshot: AppSnapshot }>("/api/requests", intake);
      setSnapshot(response.snapshot);
      setLeads([]);
      setSelectedNegotiationIds([]);
    });
  }

  async function searchForBusinesses() {
    if (!snapshot.request) return;

    await run("search", async () => {
      const response = await postJson<{ businesses: BusinessLead[] }>("/api/businesses/search", {
        requestId: snapshot.request?.id
      });
      setLeads(response.businesses);
    });
  }

  async function approveBusinesses() {
    if (!snapshot.request) return;

    await run("approve", async () => {
      const response = await postJson<{ snapshot: AppSnapshot }>("/api/businesses/approve", {
        requestId: snapshot.request?.id,
        businesses: leads
      });
      setSnapshot(response.snapshot);
    });
  }

  async function startCalls(purpose: CallPurpose) {
    if (!snapshot.request) return;

    const businessIds =
      purpose === "negotiation"
        ? selectedNegotiationIds
        : approvedBusinesses.map((business) => business.id);

    await run(purpose === "negotiation" ? "negotiation" : "inquiry", async () => {
      const response = await postJson<{ snapshot: AppSnapshot }>("/api/calls", {
        requestId: snapshot.request?.id,
        purpose,
        businessIds,
        negotiation: purpose === "negotiation" ? negotiation : undefined
      });
      setSnapshot(response.snapshot);
    });
  }

  async function generateFinalRecommendation() {
    if (!snapshot.request) return;

    await run("recommendation", async () => {
      const response = await postJson<{ snapshot: AppSnapshot }>("/api/recommendation", {
        requestId: snapshot.request?.id
      });
      setSnapshot(response.snapshot);
      if (response.snapshot.recommendation?.bestBusinessId) {
        setSelectedNegotiationIds([response.snapshot.recommendation.bestBusinessId]);
      }
    });
  }

  function updateLead(index: number, patch: Partial<BusinessLead>) {
    setLeads((current) =>
      current.map((lead, leadIndex) => (leadIndex === index ? { ...lead, ...patch } : lead))
    );
  }

  function addManualLead() {
    if (!snapshot.request) return;
    setLeads((current) => [
      ...current,
      {
        id: `manual-${crypto.randomUUID()}`,
        requestId: snapshot.request?.id || "",
        name: "Manual business",
        phone: "+1",
        address: "",
        source: "manual",
        selected: true,
        notes: ""
      }
    ]);
  }

  function removeLead(index: number) {
    setLeads((current) => current.filter((_, leadIndex) => leadIndex !== index));
  }

  function toggleNegotiationBusiness(businessId: string) {
    setSelectedNegotiationIds((current) =>
      current.includes(businessId)
        ? current.filter((id) => id !== businessId)
        : [...current, businessId]
    );
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="rounded-lg border border-ink/10 bg-paper/95 p-4 shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-coral">Haggle</p>
              <h1 className="mt-1 text-3xl font-black leading-tight text-ink">Quote calls, handled.</h1>
            </div>
            <StatusPill>
              <ShieldCheck className="h-3.5 w-3.5" />
              Demo safe
            </StatusPill>
          </div>

          <div className="grid gap-3">
            <Field label="Request">
              <TextArea
                value={intake.description}
                onChange={(event) => setIntake({ ...intake, description: event.target.value })}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Service">
                <TextInput
                  value={intake.serviceType}
                  onChange={(event) => setIntake({ ...intake, serviceType: event.target.value })}
                />
              </Field>
              <Field label="Location">
                <TextInput
                  value={intake.location}
                  onChange={(event) => setIntake({ ...intake, location: event.target.value })}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Budget">
                <TextInput
                  value={intake.budget}
                  onChange={(event) => setIntake({ ...intake, budget: event.target.value })}
                />
              </Field>
              <Field label="Timeline">
                <TextInput
                  value={intake.timeline}
                  onChange={(event) => setIntake({ ...intake, timeline: event.target.value })}
                />
              </Field>
            </div>

            <Field label="Preferences">
              <TextInput
                value={intake.preferences}
                onChange={(event) => setIntake({ ...intake, preferences: event.target.value })}
              />
            </Field>

            <Field label="Dealbreakers">
              <TextInput
                value={intake.dealbreakers}
                onChange={(event) => setIntake({ ...intake, dealbreakers: event.target.value })}
              />
            </Field>

            <Field label="Urgency">
              <select
                value={intake.urgency}
                onChange={(event) =>
                  setIntake({
                    ...intake,
                    urgency: event.target.value as IntakeInput["urgency"]
                  })
                }
                className="h-11 rounded-md border border-ink/15 bg-white px-3 text-sm outline-none transition focus:border-fern focus:ring-4 focus:ring-fern/10"
              >
                <option value="low">Flexible</option>
                <option value="normal">This week</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>

            <PrimaryButton onClick={createRequest} loading={loading === "request"}>
              <Bot className="h-4 w-4" />
              Create call plan
            </PrimaryButton>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-lg border border-ink/10 bg-white/92 p-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-steel">Pipeline</p>
                <h2 className="mt-1 text-2xl font-black text-ink">
                  {snapshot.request ? snapshot.request.status.replaceAll("_", " ") : "ready for intake"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton
                  onClick={searchForBusinesses}
                  disabled={!snapshot.request || loading !== null}
                  loading={loading === "search"}
                >
                  <Search className="h-4 w-4" />
                  Find businesses
                </SecondaryButton>
                <SecondaryButton
                  onClick={approveBusinesses}
                  disabled={!snapshot.request || !leads.length || loading !== null}
                  loading={loading === "approve"}
                >
                  <Check className="h-4 w-4" />
                  Approve {selectedLeadCount || ""}
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => startCalls("inquiry")}
                  disabled={!approvedBusinesses.length || loading !== null}
                  loading={loading === "inquiry"}
                >
                  <Phone className="h-4 w-4" />
                  Start calls
                </PrimaryButton>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
                {error}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {statusItems.map(([label, value, Icon]) => (
                <div key={String(label)} className="rounded-lg border border-ink/10 bg-paper p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink/65">{String(label)}</span>
                    <Icon className="h-4 w-4 text-fern" />
                  </div>
                  <p className="mt-2 text-xl font-black capitalize text-ink">{String(value)}</p>
                </div>
              ))}
            </div>

            {snapshot.request ? (
              <div className="mt-4 rounded-lg border border-ink/10 bg-ink p-4 text-white">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-citron">
                  <Sparkles className="h-4 w-4" />
                  Call opening
                </div>
                <p className="mt-2 text-sm leading-6 text-white/88">{snapshot.request.callPlan.opening}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-ink/10 bg-white/92 p-4 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-steel">Businesses</p>
                  <h2 className="text-xl font-black text-ink">Approve call list</h2>
                </div>
                <SecondaryButton
                  onClick={addManualLead}
                  disabled={!snapshot.request}
                  className="h-9"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </SecondaryButton>
              </div>

              <div className="grid gap-3">
                {(leads.length ? leads : snapshot.businesses).map((lead, index) => (
                  <article
                    key={lead.id}
                    className={clsx(
                      "rounded-lg border p-3 transition",
                      lead.selected ? "border-fern/35 bg-fern/5" : "border-ink/10 bg-paper"
                    )}
                  >
                    <div className="grid gap-3 md:grid-cols-[24px_1fr_150px_42px] md:items-start">
                      <input
                        aria-label={`Select ${lead.name}`}
                        type="checkbox"
                        checked={lead.selected}
                        onChange={(event) => updateLead(index, { selected: event.target.checked })}
                        disabled={!leads.length}
                        className="mt-3 h-4 w-4 accent-fern"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <TextInput
                          value={lead.name}
                          onChange={(event) => updateLead(index, { name: event.target.value })}
                          disabled={!leads.length}
                          aria-label="Business name"
                        />
                        <TextInput
                          value={lead.phone}
                          onChange={(event) => updateLead(index, { phone: event.target.value })}
                          disabled={!leads.length}
                          aria-label="Business phone"
                        />
                        <TextInput
                          value={lead.address}
                          onChange={(event) => updateLead(index, { address: event.target.value })}
                          disabled={!leads.length}
                          aria-label="Business address"
                          className="sm:col-span-2"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill>{lead.source.replace("_", " ")}</StatusPill>
                        {lead.rating ? <StatusPill>{lead.rating.toFixed(1)} stars</StatusPill> : null}
                        {callStatusByBusiness.get(lead.id) ? (
                          <StatusPill>
                            <Clock className="h-3.5 w-3.5" />
                            {callStatusByBusiness.get(lead.id)}
                          </StatusPill>
                        ) : null}
                      </div>
                      <IconButton
                        label={`Remove ${lead.name}`}
                        onClick={() => removeLead(index)}
                        disabled={!leads.length}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </article>
                ))}

                {!leads.length && !snapshot.businesses.length ? (
                  <div className="rounded-lg border border-dashed border-ink/20 bg-paper p-8 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-fern" />
                    <p className="mt-2 text-sm font-semibold text-ink/70">
                      Create a request, then search or add a business.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="rounded-lg border border-ink/10 bg-white/92 p-4 shadow-soft">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-steel">Recommendation</p>
                <h2 className="text-xl font-black text-ink">
                  {bestBusiness ? bestBusiness.name : "Pending quotes"}
                </h2>
              </div>

              <div className="mt-4 grid gap-3">
                <SecondaryButton
                  onClick={generateFinalRecommendation}
                  disabled={!completedSummaries.length || loading !== null}
                  loading={loading === "recommendation"}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh recommendation
                </SecondaryButton>

                {recommendation ? (
                  <div className="rounded-lg border border-fern/25 bg-fern/5 p-3">
                    <p className="font-black text-ink">{recommendation.headline}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">{recommendation.rationale}</p>
                    <div className="mt-3 grid gap-2">
                      {recommendation.nextSteps.map((step) => (
                        <div key={step} className="flex gap-2 text-sm text-ink/75">
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-fern" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-lg border border-ink/10 bg-paper p-3">
                  <p className="text-sm font-black text-ink">Negotiation limits</p>
                  <div className="mt-3 grid gap-2">
                    <TextInput
                      value={negotiation.targetPrice}
                      onChange={(event) =>
                        setNegotiation({ ...negotiation, targetPrice: event.target.value })
                      }
                      aria-label="Target price"
                    />
                    <TextInput
                      value={negotiation.maxPrice}
                      onChange={(event) =>
                        setNegotiation({ ...negotiation, maxPrice: event.target.value })
                      }
                      aria-label="Maximum price"
                    />
                    <select
                      value={negotiation.strategy}
                      onChange={(event) =>
                        setNegotiation({
                          ...negotiation,
                          strategy: event.target.value as typeof negotiation.strategy
                        })
                      }
                      className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm outline-none transition focus:border-fern focus:ring-4 focus:ring-fern/10"
                      aria-label="Negotiation strategy"
                    >
                      <option value="best_value">Best value</option>
                      <option value="lowest_price">Lowest price</option>
                      <option value="fastest_availability">Fastest availability</option>
                    </select>
                    <TextArea
                      value={negotiation.notes}
                      onChange={(event) =>
                        setNegotiation({ ...negotiation, notes: event.target.value })
                      }
                      aria-label="Negotiation notes"
                      className="min-h-20"
                    />
                  </div>
                </div>

                <PrimaryButton
                  onClick={() => startCalls("negotiation")}
                  disabled={!selectedNegotiationIds.length || loading !== null}
                  loading={loading === "negotiation"}
                  className="w-full bg-fern hover:bg-fern/90"
                >
                  <HandCoins className="h-4 w-4" />
                  Negotiate
                </PrimaryButton>
              </div>
            </aside>
          </div>

          <section className="rounded-lg border border-ink/10 bg-white/92 p-4 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-steel">Comparison</p>
                <h2 className="text-xl font-black text-ink">Quotes and call notes</h2>
              </div>
              <StatusPill>{completedSummaries.length} collected</StatusPill>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-ink/55">
                    <th className="border-b border-ink/10 px-3 py-2">Use</th>
                    <th className="border-b border-ink/10 px-3 py-2">Business</th>
                    <th className="border-b border-ink/10 px-3 py-2">Price</th>
                    <th className="border-b border-ink/10 px-3 py-2">Availability</th>
                    <th className="border-b border-ink/10 px-3 py-2">Notes</th>
                    <th className="border-b border-ink/10 px-3 py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.summaries.map((summary) => {
                    const business = snapshot.businesses.find(
                      (item) => item.id === summary.businessId
                    );
                    return (
                      <tr key={summary.id} className="align-top">
                        <td className="border-b border-ink/10 px-3 py-3">
                          <input
                            aria-label={`Choose ${business?.name || "business"} for negotiation`}
                            type="checkbox"
                            checked={selectedNegotiationIds.includes(summary.businessId)}
                            onChange={() => toggleNegotiationBusiness(summary.businessId)}
                            className="h-4 w-4 accent-fern"
                          />
                        </td>
                        <td className="border-b border-ink/10 px-3 py-3">
                          <p className="font-black text-ink">{business?.name || "Unknown"}</p>
                          <p className="mt-1 text-xs text-ink/55">{summary.purpose}</p>
                        </td>
                        <td className="border-b border-ink/10 px-3 py-3 font-bold text-ink">
                          {formatMoney(summary)}
                          <p className="mt-1 text-xs font-normal text-ink/55">{summary.priceText}</p>
                        </td>
                        <td className="border-b border-ink/10 px-3 py-3 text-ink/75">
                          {summary.availability}
                        </td>
                        <td className="border-b border-ink/10 px-3 py-3 text-ink/75">
                          {summary.summary}
                        </td>
                        <td className="border-b border-ink/10 px-3 py-3">
                          <StatusPill>{summary.confidence}</StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!snapshot.summaries.length ? (
              <div className="rounded-lg border border-dashed border-ink/20 bg-paper p-8 text-center">
                <Phone className="mx-auto h-8 w-8 text-fern" />
                <p className="mt-2 text-sm font-semibold text-ink/70">
                  Approved calls will appear here with prices, availability, and notes.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
