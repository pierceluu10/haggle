"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";

type ConciergeHandlers = {
  onUserUtterance: (text: string) => void;
  onShowDealers: () => void;
  onDispatchNegotiatorThird: () => void;
  onError: (message: string) => void;
};

export function useConciergeSession(handlers: ConciergeHandlers) {
  const handlersRef = useRef(handlers);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [checkedConfig, setCheckedConfig] = useState(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    fetch("/api/conversation/config")
      .then((res) => res.json())
      .then((data: { liveConcierge?: boolean }) => {
        setLiveEnabled(Boolean(data.liveConcierge));
        setCheckedConfig(true);
      })
      .catch(() => setCheckedConfig(true));
  }, []);

  const conversation = useConversation({
    clientTools: {
      show_local_dealerships: () => {
        handlersRef.current.onShowDealers();
        return "Three local dealerships are now visible in the app.";
      },
      dispatch_negotiator_third: () => {
        handlersRef.current.onDispatchNegotiatorThird();
        return "Negotiator outbound call started.";
      }
    },
    onError: (error) => {
      const message = typeof error === "string" ? error : "Concierge connection error.";
      handlersRef.current.onError(message);
    },
    onMessage: (message) => {
      const entry = message as {
        source?: string;
        message?: string;
        type?: string;
      };
      const text = entry.message?.trim();
      if (!text) return;

      const fromUser = entry.source === "user" && entry.type === "user_transcript";
      if (!fromUser) return;

      handlersRef.current.onUserUtterance(text);
    }
  });

  const startConcierge = useCallback(async () => {
    const signedRes = await fetch("/api/conversation/signed-url");
    const signedPayload = (await signedRes.json()) as {
      signedUrl?: string;
      enabled?: boolean;
      error?: string;
    };

    if (!signedRes.ok || !signedPayload.signedUrl) {
      throw new Error(signedPayload.error || "Could not start live Concierge.");
    }

    await navigator.mediaDevices.getUserMedia({ audio: true });
    await conversation.startSession({ signedUrl: signedPayload.signedUrl });
  }, [conversation]);

  const stopConcierge = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  return {
    liveEnabled: liveEnabled && checkedConfig,
    checkedConfig,
    startConcierge,
    stopConcierge,
    isConnected,
    isSpeaking: conversation.isSpeaking
  };
}
