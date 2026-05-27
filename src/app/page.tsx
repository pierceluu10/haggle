"use client";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  HandCoins,
  Layers,
  Loader2,
  MapPin,
  Mic,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Trash2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type {
  AppSnapshot,
  BusinessLead,
  CallPurpose,
  CallSummary,
  IntakeInput,
  Recommendation,
} from "@/lib/types";
import { demoIntake } from "@/lib/demo-data";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type NavPage = "dashboard" | "negotiations" | "history" | "settings" | "billing";

type AgentState = "researching" | "negotiating" | "deal" | "unavailable" | "failed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initialIntake: IntakeInput = demoIntake();

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & ApiError;
  if (!response.ok) {
    const message =
      payload.errors?.map((e) => e.message).join(" ") || "Request failed.";
    throw new Error(message);
  }
  return payload;
}

function formatMoney(summary: AppSnapshot["summaries"][number]): string {
  if (summary.priceMin && summary.priceMax && summary.priceMin !== summary.priceMax) {
    return `$${summary.priceMin}–$${summary.priceMax}`;
  }
  if (summary.priceMin || summary.priceMax) {
    return `$${summary.priceMin || summary.priceMax}`;
  }
  return summary.priceText;
}

function deriveAgentState(
  callStatus: string | undefined,
  summary: CallSummary | undefined
): AgentState {
  if (!callStatus) return "researching";
  if (callStatus === "calling" || callStatus === "queued") return "negotiating";
  if (callStatus === "completed") {
    if (!summary) return "researching";
    if (summary.outcome === "quote_collected") return "deal";
    if (summary.outcome === "unavailable" || summary.outcome === "voicemail")
      return "unavailable";
    return "researching";
  }
  if (callStatus === "failed") return "failed";
  return "researching";
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: "blue" | "green" | "none";
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white/[0.03] backdrop-blur-sm transition-all duration-300",
        glow === "blue"
          ? "border-blue-500/30 shadow-[0_0_22px_rgba(59,130,246,0.18)]"
          : glow === "green"
          ? "border-emerald-500/30 shadow-[0_0_22px_rgba(16,185,129,0.18)]"
          : "border-white/[0.08]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  accent?: "blue" | "green";
}) {
  return (
    <GlassCard className="p-3">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] text-zinc-500">{label}</p>
        {Icon && (
          <Icon
            className={clsx(
              "h-3.5 w-3.5 shrink-0",
              accent === "green" ? "text-emerald-400" : "text-blue-400"
            )}
          />
        )}
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-[#e2e2e2]">{value}</p>
      {change && (
        <p
          className={clsx(
            "mt-0.5 text-xs font-medium",
            change.startsWith("+") ? "text-emerald-400" : "text-red-400"
          )}
        >
          {change}
        </p>
      )}
    </GlassCard>
  );
}

// ─── Agent State Badge ────────────────────────────────────────────────────────

function AgentStateBadge({ state }: { state: AgentState }) {
  const cfg: Record<
    AgentState,
    { label: string; cls: string; dot?: string }
  > = {
    researching: {
      label: "Researching",
      cls: "text-blue-300 bg-blue-500/10 border-blue-500/20",
      dot: "bg-blue-300 opacity-60",
    },
    negotiating: {
      label: "Negotiating",
      cls: "text-blue-400 bg-blue-500/15 border-blue-500/30",
      dot: "bg-blue-400 animate-pulse",
    },
    deal: {
      label: "Deal Secured",
      cls: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    },
    unavailable: {
      label: "Unavailable",
      cls: "text-zinc-500 bg-white/[0.04] border-white/[0.08]",
    },
    failed: {
      label: "Failed",
      cls: "text-red-400 bg-red-500/10 border-red-500/20",
    },
  };
  const { label, cls, dot } = cfg[state];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        cls
      )}
    >
      {state === "deal" ? (
        <Check className="h-3 w-3" />
      ) : (
        dot && <span className={clsx("h-1.5 w-1.5 rounded-full", dot)} />
      )}
      {label}
    </span>
  );
}

// ─── Thinking Dots ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-blue-400"
          style={{
            animation: "thinking-dot 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Mini Waveform ────────────────────────────────────────────────────────────

function MiniWaveform({ active }: { active: boolean }) {
  const bars = [3, 6, 4, 8, 5, 7, 3, 6, 5, 7];
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className={clsx(
            "w-[2px] origin-bottom rounded-full",
            active ? "bg-blue-400" : "bg-zinc-600"
          )}
          style={{
            height: active ? h * 2 : 3,
            animation: active
              ? `bar-bounce ${0.55 + (i % 3) * 0.08}s ease-in-out infinite`
              : "none",
            animationDelay: `${i * 55}ms`,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Donut Chart (pure CSS conic-gradient) ────────────────────────────────────

function DonutChart({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cum = 0;
  const parts = segments.map((seg) => {
    const start = (cum / total) * 360;
    cum += seg.value;
    const end = (cum / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-16 w-16 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${parts.join(", ")})` }}
      >
        <div className="absolute inset-[9px] rounded-full bg-[#0a0a0a]" />
      </div>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: seg.color }}
            />
            <span className="text-zinc-500">{seg.label}</span>
            <span className="ml-auto font-medium text-[#e2e2e2]">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({
  business,
  callStatus,
  summary,
  expanded,
  onToggle,
  isSelected,
  onSelect,
}: {
  business: BusinessLead;
  callStatus?: string;
  summary?: CallSummary;
  expanded: boolean;
  onToggle: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const state = deriveAgentState(callStatus, summary);
  const glow =
    state === "negotiating" ? "blue" : state === "deal" ? "green" : "none";

  return (
    <div
      className={clsx(
        "rounded-xl border bg-white/[0.03] backdrop-blur-sm transition-all duration-300 overflow-hidden",
        state === "negotiating"
          ? "border-blue-500/30 agent-card-negotiating"
          : state === "deal"
          ? "border-emerald-500/30 shadow-[0_0_22px_rgba(16,185,129,0.18)]"
          : state === "failed"
          ? "border-red-500/20"
          : "border-white/[0.08]"
      )}
    >
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        {/* Icon */}
        <div
          className={clsx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            state === "negotiating"
              ? "border-blue-500/40 bg-blue-500/15"
              : state === "deal"
              ? "border-emerald-500/40 bg-emerald-500/15"
              : state === "failed"
              ? "border-red-500/30 bg-red-500/10"
              : "border-white/[0.08] bg-white/[0.04]"
          )}
        >
          {state === "negotiating" ? (
            <Phone className="h-4 w-4 text-blue-400" />
          ) : state === "deal" ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : state === "failed" ? (
            <MapPin className="h-4 w-4 text-red-400" />
          ) : (
            <Bot className="h-4 w-4 text-zinc-500" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#e2e2e2]">
            {business.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {state === "researching" ? (
              <ThinkingDots />
            ) : (
              <p className="truncate text-xs text-zinc-500">
                {business.address || business.phone || "No address"}
              </p>
            )}
          </div>
        </div>

        {/* Right: price + badge + waveform + chevron */}
        <div className="flex shrink-0 items-center gap-3">
          {summary && (
            <p className="text-sm font-bold text-[#e2e2e2]">{formatMoney(summary)}</p>
          )}
          <AgentStateBadge state={state} />
          <MiniWaveform active={state === "negotiating"} />
          <ChevronDown
            className={clsx(
              "h-4 w-4 text-zinc-600 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Deal data */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Deal Data
              </p>
              <div className="space-y-2">
                {(
                  [
                    ["Vendor", business.name],
                    summary ? ["Price", formatMoney(summary)] : null,
                    summary ? ["Availability", summary.availability || "—"] : null,
                    business.phone ? ["Phone", business.phone] : null,
                    business.rating
                      ? ["Rating", `★ ${business.rating.toFixed(1)}`]
                      : null,
                  ].filter((row): row is [string, string] => row !== null)
                ).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{k}</span>
                      <span className="font-medium text-[#e2e2e2]">{v}</span>
                    </div>
                  ))}
                {summary && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Confidence</span>
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        summary.confidence === "high"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : summary.confidence === "medium"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400"
                      )}
                    >
                      {summary.confidence}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Call notes */}
            {summary?.summary && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Call Notes
                </p>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {summary.summary}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            {summary && (
              <button
                onClick={onSelect}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  isSelected
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                    : "border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                )}
              >
                <Check className="h-3.5 w-3.5" />
                {isSelected ? "Selected for Negotiation" : "Use This Deal"}
              </button>
            )}
            {summary?.transcript && (
              <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-500 transition hover:border-white/20 hover:text-[#e2e2e2]">
                <Play className="h-3.5 w-3.5" />
                Replay Call
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Voice Oscillator ─────────────────────────────────────────────────────────

function VoiceOscillator({ active }: { active: boolean }) {
  const heights = [3, 5, 8, 5, 10, 7, 9, 4, 7, 10, 8, 5, 9, 4, 7, 10, 5, 8, 4, 3];
  return (
    <div className="flex shrink-0 items-end gap-[3px]" style={{ height: 36 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={clsx(
            "w-[3px] origin-bottom rounded-full transition-all duration-500",
            active ? "bg-blue-500" : "bg-zinc-700"
          )}
          style={{
            height: active ? `${(h / 10) * 100}%` : "12%",
            animation: active
              ? `bar-bounce ${0.55 + (i % 4) * 0.07}s ease-in-out infinite`
              : "none",
            animationDelay: `${i * 42}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Dark Input / Select ──────────────────────────────────────────────────────

function DarkInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-[#e2e2e2] placeholder-zinc-600 outline-none transition focus:border-blue-500/40 focus:bg-white/[0.06]",
        className
      )}
    />
  );
}

function DarkTextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full resize-none rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-[#e2e2e2] placeholder-zinc-600 outline-none transition focus:border-blue-500/40 focus:bg-white/[0.06]",
        className
      )}
    />
  );
}

function DarkSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "rounded-md border border-white/[0.08] bg-[#111] px-2.5 py-1.5 text-sm text-[#e2e2e2] outline-none transition focus:border-blue-500/40",
        className
      )}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [intake, setIntake] = useState<IntakeInput>(initialIntake);
  const [snapshot, setSnapshot] = useState<AppSnapshot>({
    businesses: [],
    calls: [],
    summaries: [],
  });
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState<LoadingKey | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedNegotiationIds, setSelectedNegotiationIds] = useState<string[]>([]);
  const [negotiation, setNegotiation] = useState({
    targetPrice: "$250",
    maxPrice: "$350",
    strategy: "best_value" as const,
    notes:
      "Ask for a lower call-out fee or an earlier appointment, but do not book anything.",
  });

  // UI state
  const [activePage, setActivePage] = useState<NavPage>("dashboard");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showNegotiationPanel, setShowNegotiationPanel] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedLeadCount = leads.filter((l) => l.selected).length;
  const approvedBusinesses = snapshot.businesses.filter((b) => b.selected);
  const completedSummaries = snapshot.summaries.filter(
    (s) => s.outcome === "quote_collected"
  );
  const recommendation: Recommendation | undefined = snapshot.recommendation;

  const bestBusiness = useMemo(
    () => snapshot.businesses.find((b) => b.id === recommendation?.bestBusinessId),
    [recommendation?.bestBusinessId, snapshot.businesses]
  );

  const callStatusByBusiness = useMemo(() => {
    const map = new Map<string, string>();
    for (const call of snapshot.calls) map.set(call.businessId, call.status);
    return map;
  }, [snapshot.calls]);

  const activeAgentCount = snapshot.calls.filter(
    (c) => c.status === "calling" || c.status === "queued"
  ).length;

  const totalSavings = completedSummaries.reduce((acc, s) => {
    if (s.priceMin && s.priceMax) return acc + (s.priceMax - s.priceMin);
    return acc;
  }, 0);

  const successRate =
    snapshot.calls.length > 0
      ? Math.round((completedSummaries.length / snapshot.calls.length) * 100)
      : 89;

  const swarmActive = loading !== null || activeAgentCount > 0;

  // ── Actions ───────────────────────────────────────────────────────────────────
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
      const res = await postJson<{ snapshot: AppSnapshot }>("/api/requests", intake);
      setSnapshot(res.snapshot);
      setLeads([]);
      setSelectedNegotiationIds([]);
    });
  }

  async function searchForBusinesses() {
    if (!snapshot.request) return;
    await run("search", async () => {
      const res = await postJson<{ businesses: BusinessLead[] }>(
        "/api/businesses/search",
        { requestId: snapshot.request?.id }
      );
      setLeads(res.businesses);
    });
  }

  async function approveBusinesses() {
    if (!snapshot.request) return;
    await run("approve", async () => {
      const res = await postJson<{ snapshot: AppSnapshot }>("/api/businesses/approve", {
        requestId: snapshot.request?.id,
        businesses: leads,
      });
      setSnapshot(res.snapshot);
    });
  }

  async function startCalls(purpose: CallPurpose) {
    if (!snapshot.request) return;
    const businessIds =
      purpose === "negotiation"
        ? selectedNegotiationIds
        : approvedBusinesses.map((b) => b.id);
    await run(purpose === "negotiation" ? "negotiation" : "inquiry", async () => {
      const res = await postJson<{ snapshot: AppSnapshot }>("/api/calls", {
        requestId: snapshot.request?.id,
        purpose,
        businessIds,
        negotiation: purpose === "negotiation" ? negotiation : undefined,
      });
      setSnapshot(res.snapshot);
    });
  }

  async function generateFinalRecommendation() {
    if (!snapshot.request) return;
    await run("recommendation", async () => {
      const res = await postJson<{ snapshot: AppSnapshot }>("/api/recommendation", {
        requestId: snapshot.request?.id,
      });
      setSnapshot(res.snapshot);
      if (res.snapshot.recommendation?.bestBusinessId) {
        setSelectedNegotiationIds([res.snapshot.recommendation.bestBusinessId]);
      }
    });
  }

  function updateLead(index: number, patch: Partial<BusinessLead>) {
    setLeads((cur) => cur.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addManualLead() {
    if (!snapshot.request) return;
    setLeads((cur) => [
      ...cur,
      {
        id: `manual-${crypto.randomUUID()}`,
        requestId: snapshot.request?.id || "",
        name: "Manual business",
        phone: "+1",
        address: "",
        source: "manual",
        selected: true,
        notes: "",
      },
    ]);
  }

  function removeLead(index: number) {
    setLeads((cur) => cur.filter((_, i) => i !== index));
  }

  function toggleNegotiationBusiness(businessId: string) {
    setSelectedNegotiationIds((cur) =>
      cur.includes(businessId)
        ? cur.filter((id) => id !== businessId)
        : [...cur, businessId]
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-[#e2e2e2]">
      {/* ── HEADER ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">Haggle</span>
        </div>

        {/* Live status pill */}
        <div
          className={clsx(
            "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-500",
            swarmActive
              ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
              : "border-white/[0.07] bg-white/[0.02] text-zinc-500"
          )}
        >
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              swarmActive ? "animate-pulse bg-blue-400" : "bg-zinc-600"
            )}
          />
          {swarmActive ? "Agent Swarm Active" : "Listening..."}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {snapshot.request ? "Session active" : "4,231 credits"}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
            J
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR ── */}
        <nav className="flex w-52 shrink-0 flex-col border-r border-white/[0.07]">
          {/* Nav items */}
          <div className="flex-1 space-y-0.5 p-3 pt-4">
            {(
              [
                { id: "dashboard", label: "Dashboard", icon: Layers },
                { id: "negotiations", label: "Active Negotiations", icon: Activity },
                { id: "history", label: "Deal History", icon: FileText },
                { id: "settings", label: "Agent Settings", icon: Settings },
                { id: "billing", label: "Billing", icon: DollarSign },
              ] as Array<{ id: NavPage; label: string; icon: LucideIcon }>
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activePage === id
                    ? "bg-blue-500/15 text-blue-300"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-[#e2e2e2]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* Pipeline action buttons */}
          <div className="space-y-1 border-t border-white/[0.07] p-3">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Pipeline
            </p>
            <button
              onClick={searchForBusinesses}
              disabled={!snapshot.request || loading !== null}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-[#e2e2e2] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading === "search" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Find Businesses
            </button>

            <button
              onClick={approveBusinesses}
              disabled={!leads.length || loading !== null}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-[#e2e2e2] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve{selectedLeadCount > 0 ? ` (${selectedLeadCount})` : ""}
            </button>

            <button
              onClick={() => startCalls("inquiry")}
              disabled={!approvedBusinesses.length || loading !== null}
              className="flex w-full items-center gap-2.5 rounded-lg bg-blue-500/12 px-3 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading === "inquiry" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Start Calls
            </button>
          </div>
        </nav>

        {/* ── CENTER: AGENT SWARM ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Center top bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-6 py-3.5">
            <div>
              <h1 className="flex items-center gap-2 text-base font-semibold text-[#e2e2e2]">
                Active Negotiations
                {(leads.length || snapshot.businesses.length) > 0 && (
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300">
                    {leads.length || snapshot.businesses.length} Agents
                  </span>
                )}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                {snapshot.request
                  ? snapshot.request.status.replaceAll("_", " ")
                  : "Ready for intake — speak or type below"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {completedSummaries.length > 0 && (
                <button
                  onClick={generateFinalRecommendation}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/20 hover:text-[#e2e2e2] disabled:opacity-40"
                >
                  {loading === "recommendation" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Get Recommendation
                </button>
              )}
              {selectedNegotiationIds.length > 0 && (
                <button
                  onClick={() => startCalls("negotiation")}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-40"
                >
                  {loading === "negotiation" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <HandCoins className="h-3.5 w-3.5" />
                  )}
                  Negotiate ({selectedNegotiationIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Error bar */}
          {error && (
            <div className="mx-6 mt-4 shrink-0 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Scrollable agent list */}
          <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
            {/* Call plan opening */}
            {snapshot.request?.callPlan.opening && (
              <GlassCard className="px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Call Opening
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {snapshot.request.callPlan.opening}
                </p>
              </GlassCard>
            )}

            {/* Leads: pending approval */}
            {leads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Found — Approve to Deploy Agents
                  </p>
                  <button
                    onClick={addManualLead}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {leads.map((lead, index) => (
                  <GlassCard key={lead.id} className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={lead.selected}
                        onChange={(e) => updateLead(index, { selected: e.target.checked })}
                        className="h-4 w-4 accent-blue-500"
                        aria-label={`Select ${lead.name}`}
                      />
                      <div className="flex min-w-0 flex-1 gap-2">
                        <DarkInput
                          value={lead.name}
                          onChange={(e) => updateLead(index, { name: e.target.value })}
                          className="flex-1"
                          aria-label="Business name"
                        />
                        <DarkInput
                          value={lead.phone}
                          onChange={(e) => updateLead(index, { phone: e.target.value })}
                          className="w-32"
                          aria-label="Business phone"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {lead.rating && <span>★ {lead.rating.toFixed(1)}</span>}
                        <button
                          onClick={() => removeLead(index)}
                          className="text-zinc-600 transition hover:text-red-400"
                          aria-label={`Remove ${lead.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Approved agent cards */}
            {snapshot.businesses.map((business) => (
              <AgentCard
                key={business.id}
                business={business}
                callStatus={callStatusByBusiness.get(business.id)}
                summary={snapshot.summaries.find((s) => s.businessId === business.id)}
                expanded={expandedCardId === business.id}
                onToggle={() =>
                  setExpandedCardId(expandedCardId === business.id ? null : business.id)
                }
                isSelected={selectedNegotiationIds.includes(business.id)}
                onSelect={() => toggleNegotiationBusiness(business.id)}
              />
            ))}

            {/* Empty state */}
            {leads.length === 0 && snapshot.businesses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/[0.05]">
                  <Bot className="h-9 w-9 text-blue-400/60" />
                </div>
                <h2 className="text-xl font-semibold text-[#e2e2e2]">Agent Swarm Idle</h2>
                <p className="mt-2 max-w-xs text-sm text-zinc-500">
                  Describe your negotiation goal below and press the mic button. Agents will
                  appear here and negotiate in real-time.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT: INSIGHTS ── */}
        <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-white/[0.07] p-4">
          {/* KPIs */}
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Overview
          </p>
          <div className="grid grid-cols-2 gap-2">
            <KpiCard
              label="Total Savings"
              value={
                totalSavings > 0 ? `$${totalSavings.toLocaleString()}` : "$4,231"
              }
              change="+12.5%"
              icon={TrendingUp}
              accent="green"
            />
            <KpiCard
              label="Active Agents"
              value={activeAgentCount || snapshot.businesses.length || 4}
              icon={Activity}
            />
            <KpiCard label="Avg. Deal Time" value="2.4 min" icon={Clock} />
            <KpiCard
              label="Success Rate"
              value={`${successRate}%`}
              change="+3%"
              icon={BadgeCheck}
              accent="green"
            />
          </div>

          {/* Donut chart */}
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Categories
            </p>
            <GlassCard className="p-3">
              <DonutChart
                segments={[
                  { label: "Logistics", value: 45, color: "#3b82f6" },
                  { label: "Raw Materials", value: 30, color: "#8b5cf6" },
                  { label: "Services", value: 15, color: "#10b981" },
                  { label: "Other", value: 10, color: "#52525b" },
                ]}
              />
            </GlassCard>
          </div>

          {/* Deal summary */}
          {completedSummaries.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Deal Summary
              </p>
              <div className="space-y-2">
                {completedSummaries.map((summary) => {
                  const biz = snapshot.businesses.find(
                    (b) => b.id === summary.businessId
                  );
                  return (
                    <GlassCard key={summary.id} glow="green" className="px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="max-w-[130px] truncate text-sm font-medium text-[#e2e2e2]">
                          {biz?.name || "Unknown"}
                        </p>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatMoney(summary)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span className="truncate">{summary.availability}</span>
                        <button
                          onClick={() => toggleNegotiationBusiness(summary.businessId)}
                          className={clsx(
                            "ml-auto flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 transition",
                            selectedNegotiationIds.includes(summary.businessId)
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-white/[0.05] hover:text-[#e2e2e2]"
                          )}
                        >
                          <Play className="h-2.5 w-2.5" />
                          {selectedNegotiationIds.includes(summary.businessId)
                            ? "Selected"
                            : "Use"}
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {recommendation && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                AI Recommendation
              </p>
              <GlassCard glow="green" className="px-3 py-3">
                <p className="text-sm font-semibold text-[#e2e2e2]">
                  {recommendation.headline}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {recommendation.rationale}
                </p>
                <div className="mt-3 space-y-1.5">
                  {recommendation.nextSteps.slice(0, 3).map((step) => (
                    <div key={step} className="flex gap-2 text-xs text-zinc-500">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Negotiation limits (collapsible) */}
          <div className="mt-5">
            <button
              onClick={() => setShowNegotiationPanel(!showNegotiationPanel)}
              className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-600 transition hover:text-zinc-400"
            >
              Negotiation Limits
              <ChevronDown
                className={clsx(
                  "h-3 w-3 transition-transform",
                  showNegotiationPanel && "rotate-180"
                )}
              />
            </button>
            {showNegotiationPanel && (
              <GlassCard className="mt-2 space-y-2 p-3">
                <DarkInput
                  value={negotiation.targetPrice}
                  onChange={(e) =>
                    setNegotiation({ ...negotiation, targetPrice: e.target.value })
                  }
                  placeholder="Target price"
                  className="w-full"
                  aria-label="Target price"
                />
                <DarkInput
                  value={negotiation.maxPrice}
                  onChange={(e) =>
                    setNegotiation({ ...negotiation, maxPrice: e.target.value })
                  }
                  placeholder="Max price"
                  className="w-full"
                  aria-label="Max price"
                />
                <DarkSelect
                  value={negotiation.strategy}
                  onChange={(e) =>
                    setNegotiation({
                      ...negotiation,
                      strategy: e.target.value as typeof negotiation.strategy,
                    })
                  }
                  className="w-full"
                  aria-label="Negotiation strategy"
                >
                  <option value="best_value">Best Value</option>
                  <option value="lowest_price">Lowest Price</option>
                  <option value="fastest_availability">Fastest Availability</option>
                </DarkSelect>
                <DarkTextArea
                  value={negotiation.notes}
                  onChange={(e) =>
                    setNegotiation({ ...negotiation, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Additional instructions..."
                  aria-label="Negotiation notes"
                />
              </GlassCard>
            )}
          </div>
        </aside>
      </div>

      {/* ── BOTTOM: VOICE OSCILLATOR BAR ── */}
      <div className="flex h-[86px] shrink-0 items-center gap-4 border-t border-white/[0.07] bg-black/30 px-5">
        {/* Oscillator */}
        <VoiceOscillator active={swarmActive} />

        {/* Input area */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            value={intake.description}
            onChange={(e) => setIntake({ ...intake, description: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void createRequest();
              }
            }}
            placeholder="Speak to Haggle... (e.g., Find me a deal on 500 office chairs under $50)"
            className="w-full bg-transparent text-sm text-[#e2e2e2] placeholder-zinc-600 outline-none"
          />
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              {
                key: "serviceType" as keyof IntakeInput,
                placeholder: "Service",
                w: "w-24",
              },
              {
                key: "location" as keyof IntakeInput,
                placeholder: "Location",
                w: "w-28",
              },
              {
                key: "budget" as keyof IntakeInput,
                placeholder: "Budget",
                w: "w-20",
              },
              {
                key: "timeline" as keyof IntakeInput,
                placeholder: "Timeline",
                w: "w-20",
              },
              {
                key: "preferences" as keyof IntakeInput,
                placeholder: "Preferences",
                w: "w-28",
              },
            ].map(({ key, placeholder, w }) => (
              <input
                key={key}
                value={intake[key] as string}
                onChange={(e) => setIntake({ ...intake, [key]: e.target.value })}
                placeholder={placeholder}
                className={clsx(
                  "shrink-0 rounded bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-500 outline-none transition focus:bg-white/[0.07] focus:text-[#e2e2e2]",
                  w
                )}
              />
            ))}
            <select
              value={intake.urgency}
              onChange={(e) =>
                setIntake({ ...intake, urgency: e.target.value as IntakeInput["urgency"] })
              }
              className="shrink-0 rounded bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-500 outline-none transition focus:bg-white/[0.07] focus:text-[#e2e2e2] bg-transparent"
            >
              <option value="low">Flexible</option>
              <option value="normal">This week</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Mic / submit button */}
        <button
          onClick={() => void createRequest()}
          disabled={loading === "request"}
          aria-label="Send to Haggle"
          className={clsx(
            "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300",
            loading === "request"
              ? "bg-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.65)]"
              : "border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          )}
        >
          {loading === "request" ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Mic className="h-5 w-5 text-blue-400" />
          )}
        </button>
      </div>
    </div>
  );
}
