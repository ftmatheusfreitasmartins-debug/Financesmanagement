"use client";

import { useEffect, useRef } from "react";
import { useFinanceStore } from "@/store/financeStore";
import { cloudLoad, cloudSave } from "@/lib/cloudFinance";

export default function CloudSync() {
  const ready = useRef(false);
  const t = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const remote = await cloudLoad();
        if (!alive) return;

        if (remote?.data?.state) {
          useFinanceStore.setState(remote.data.state);
        }
      } finally {
        ready.current = true;
      }
    })();

    const unsub = useFinanceStore.subscribe((state) => {
      if (!ready.current) return;
      if (t.current) window.clearTimeout(t.current);

      t.current = window.setTimeout(() => {
        cloudSave(state).catch(() => {});
      }, 800);
    });

    return () => {
      alive = false;
      unsub();
      if (t.current) window.clearTimeout(t.current);
    };
  }, []);

  return null;
}
