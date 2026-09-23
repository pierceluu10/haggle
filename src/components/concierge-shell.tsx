"use client";

import { ConversationProvider } from "@elevenlabs/react";
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
      <main className="stage grid min-h-screen place-items-center">
        <div className="orb-stage h-28 w-28">
          <span className="orb-shadow" />
          <span className="orb block h-full w-full animate-breathe-active opacity-90" />
        </div>
      </main>
    );
  }

  return (
    <ConversationProvider agentId={agentId!}>
      <ConciergeApp />
    </ConversationProvider>
  );
}
