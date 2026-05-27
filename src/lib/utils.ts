export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return digits ? `+${digits}` : trimmed;
}

export function isValidPhoneNumber(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhoneNumber(value));
}

export function parseMoneyRange(text: string): { priceMin?: number; priceMax?: number } {
  const numbers = text
    .match(/\d+(?:,\d{3})*(?:\.\d{1,2})?/g)
    ?.map((part) => Number(part.replaceAll(",", "")))
    .filter((num) => Number.isFinite(num));

  if (!numbers?.length) {
    return {};
  }

  return {
    priceMin: Math.min(...numbers),
    priceMax: Math.max(...numbers)
  };
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function shouldUseLiveCalls(): boolean {
  return (
    !isDemoMode() &&
    Boolean(process.env.ELEVENLABS_API_KEY) &&
    Boolean(process.env.ELEVENLABS_AGENT_ID) &&
    Boolean(process.env.ELEVENLABS_PHONE_NUMBER_ID)
  );
}

export function shouldUseLiveAi(): boolean {
  return !isDemoMode() && Boolean(process.env.OPENAI_API_KEY);
}

export function shouldUseLivePlaces(): boolean {
  return !isDemoMode() && Boolean(process.env.GOOGLE_MAPS_API_KEY);
}
