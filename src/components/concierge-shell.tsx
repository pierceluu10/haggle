"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConciergeApp from "@/components/concierge-app";

export default function ConciergeShell() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/conversation/config")
      .then((res) => res.json())
      .then((data: { conciergeAgentId?: string | null }) => {
        setAgentId(data.conciergeAgentId || "local-fallback");
        setReady(true);
      })
      .catch(() => {
        setAgentId("local-fallback");
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <main className="voice-bg grid min-h-screen place-items-center text-white/60">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <ConversationProvider agentId={agentId!}>
      <ConciergeApp />
    </ConversationProvider>
  );
}
