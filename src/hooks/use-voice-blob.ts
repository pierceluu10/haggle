"use client";

import { useEffect, useRef } from "react";

type AudioContextCtor = typeof AudioContext;

type Options = {
  pathRef: React.RefObject<SVGPathElement | null>;
  stageRef: React.RefObject<HTMLElement | null>;
  active: boolean;
  speaking: boolean;
};

const POINTS = 56;
const BASE_R = 0.34;
const MAX_OUT = 0.15;
const MAX_IN = 0.08;

/** Smooth closed path through points via Catmull-Rom → cubic béziers. */
function smoothClosedPath(pts: number[][]) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(4)},${pts[0][1].toFixed(4)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d +=
      `C${c1x.toFixed(4)},${c1y.toFixed(4)} ` +
      `${c2x.toFixed(4)},${c2y.toFixed(4)} ` +
      `${p2[0].toFixed(4)},${p2[1].toFixed(4)}`;
  }
  return `${d}Z`;
}

/** Static near-circle used for SSR and the reduced-motion fallback. */
export function circlePath() {
  const pts: number[][] = [];
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    pts.push([0.5 + Math.cos(a) * BASE_R, 0.5 + Math.sin(a) * BASE_R]);
  }
  return smoothClosedPath(pts);
}

/**
 * Deforms the sphere's silhouette into a live waveform: the rim spikes and
 * undulates with your voice's frequency spectrum (mirrored for a seamless
 * loop), settling into a gentle idle wobble when quiet.
 */
export function useVoiceBlob({ pathRef, stageRef, active, speaking }: Options) {
  const levelRef = useRef(0);
  const freqRef = useRef<Uint8Array | null>(null);
  const smoothLevel = useRef(0);
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;

  // Microphone analysis — only while active.
  useEffect(() => {
    if (!active) {
      levelRef.current = 0;
      freqRef.current = null;
      return;
    }

    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        const Ctor: AudioContextCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: AudioContextCtor })
            .webkitAudioContext;
        ctx = new Ctor();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const time = new Uint8Array(analyser.fftSize);
        const freq = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteTimeDomainData(time);
          let sum = 0;
          for (let i = 0; i < time.length; i++) {
            const v = (time[i] - 128) / 128;
            sum += v * v;
          }
          levelRef.current = Math.min(1, Math.sqrt(sum / time.length) * 3.4);
          analyser.getByteFrequencyData(freq);
          freqRef.current = freq;
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // No mic — the rim falls back to its idle wobble.
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      ctx?.close().catch(() => {});
      levelRef.current = 0;
      freqRef.current = null;
    };
  }, [active]);

  // Render loop — always runs (idle wobble), respects reduced motion.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      path.setAttribute("d", circlePath());
      return;
    }

    let raf = 0;
    let t = 0;
    let last = performance.now();
    const pts: number[][] = new Array(POINTS);
    const half = Math.floor(POINTS / 2);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      let target = levelRef.current;
      if (speakingRef.current) {
        const pulse = 0.3 + 0.26 * (0.5 + 0.5 * Math.sin(t * 4));
        target = Math.max(target, pulse);
      }
      const k = target > smoothLevel.current ? 0.35 : 0.12;
      smoothLevel.current += (target - smoothLevel.current) * k;
      const lv = smoothLevel.current;
      stageRef.current?.style.setProperty("--level", lv.toFixed(3));

      const freq = freqRef.current;
      const idleAmp = 0.014;

      for (let i = 0; i < POINTS; i++) {
        const ang = (i / POINTS) * Math.PI * 2;
        const wob =
          Math.sin(ang * 2 + t * 0.6) * 0.5 +
          Math.sin(ang * 3 - t * 0.9) * 0.32 +
          Math.sin(ang * 5 + t * 1.3) * 0.18;

        let f = 0;
        if (freq) {
          const idx = i < half ? i : POINTS - 1 - i; // mirror for a seamless loop
          const bin = 2 + Math.floor((idx / half) * Math.min(freq.length - 3, 38));
          f = freq[bin] / 255;
        }

        let perturb = wob * idleAmp + lv * (f * 0.145 + 0.03 * Math.sin(ang * 4 - t * 1.7));
        if (perturb > MAX_OUT) perturb = MAX_OUT;
        if (perturb < -MAX_IN) perturb = -MAX_IN;

        const r = BASE_R + perturb;
        pts[i] = [0.5 + Math.cos(ang) * r, 0.5 + Math.sin(ang) * r];
      }

      path.setAttribute("d", smoothClosedPath(pts));
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pathRef, stageRef]);
}
