import type { DemoContact } from "@/lib/contacts";
import type { CallRole } from "@/lib/types";

const ORDINALS: Record<string, number> = {
  first: 0,
  "1st": 0,
  one: 0,
  second: 1,
  "2nd": 1,
  two: 1,
  third: 2,
  "3rd": 2,
  three: 2
};

export type VoiceAction =
  | { type: "show_dealers" }
  | { type: "call"; target: DemoContact; role: CallRole }
  | { type: "none" };

/** Strict: user must ask to list/find dealers — not casual mention of "dealer". */
export function parseShowDealerships(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const wantsList =
    /pull up|show (me )?(the )?|find (me )?|list|look up|search for|give me/.test(lower);
  const aboutDealers = /dealerships?|car dealers?|local dealers?/.test(lower);
  return wantsList && aboutDealers;
}

export function parseIsNegotiation(message: string): boolean {
  const lower = message.toLowerCase();
  return /negotiat|haggle|lower the price|better price|talk them down|match.*dealer|out the door|otd|negotiator/.test(
    lower
  );
}

export function parseCallTarget(
  message: string,
  contacts: DemoContact[]
): DemoContact | undefined {
  const lower = message.toLowerCase().trim();
  if (!lower) {
    return undefined;
  }

  const wantsCall = /call|dial|ring|phone/.test(lower);
  if (!wantsCall) {
    return undefined;
  }

  for (const [word, index] of Object.entries(ORDINALS)) {
    if (
      lower.includes(word) ||
      lower.includes(`number ${word}`) ||
      lower.includes(`#${index + 1}`)
    ) {
      return contacts[index];
    }
  }

  if (/\b(3|three)\b/.test(lower)) {
    return contacts[2];
  }

  for (const contact of contacts) {
    if (lower.includes("647") && lower.includes("6387")) {
      return contacts[2];
    }
    if (lower.includes(contact.displayPhone.replace(/\D/g, ""))) {
      return contact;
    }
  }

  return undefined;
}

export function resolveCallRole(
  _message: string,
  target: DemoContact,
  contacts: DemoContact[]
): CallRole {
  const index = contacts.findIndex((c) => c.id === target.id);
  if (index === 2) {
    return "negotiation";
  }
  return "inquiry";
}

export function resolveVoiceAction(message: string, contacts: DemoContact[]): VoiceAction {
  if (parseShowDealerships(message)) {
    return { type: "show_dealers" };
  }

  const target = parseCallTarget(message, contacts);
  if (!target) {
    return { type: "none" };
  }

  return {
    type: "call",
    target,
    role: resolveCallRole(message, target, contacts)
  };
}

export function processUserUtterance(
  message: string,
  contacts: DemoContact[],
  handlers: {
    onShowDealers: () => void;
    onCall: (target: DemoContact, role: CallRole, message: string) => void;
  }
): void {
  const action = resolveVoiceAction(message, contacts);

  if (action.type === "show_dealers") {
    handlers.onShowDealers();
    return;
  }

  if (action.type === "call") {
    handlers.onCall(action.target, action.role, message);
  }
}
