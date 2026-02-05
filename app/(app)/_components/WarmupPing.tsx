"use client";

import { useEffect, useRef } from "react";

export default function WarmupPing() {
  const didRun = useRef(false);

  useEffect(() => {
    // Absolute guard against dev double-invoke and multiple mounts.
    if (didRun.current) return;
    didRun.current = true;

    const key = "fc_warmup_done";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);

    // Fire-and-forget; do not block UI
    fetch("/api/warmup", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
      .catch(() => {})
      .finally(() => clearTimeout(t));
  }, []);

  return null;
}
