"use client";

import { useEffect, useRef } from "react";
import { useFinanceStore } from "@/store/financeStore";
import { cloudLoad, cloudSave } from "@/lib/cloudFinance";

export default function CloudSync() {
  const ready = useRef(false);
  const canSave = useRef(false); // <- NOVO: só salva se load deu certo
  const t = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const remote = await cloudLoad();
        if (!alive) return;

        // Se chegou resposta do backend, então está "autorizado/online" o suficiente
        canSave.current = true;

        if (remote?.data?.state) {
          useFinanceStore.setState(remote.data.state);
        }
      } catch (err) {
        // Falhou carregar: NÃO habilita salvar, para não sobrescrever o banco com state vazio
        canSave.current = false;
        console.warn("CloudSync indisponível:", err);
      } finally {
        ready.current = true;
      }
    })();

    const unsub = useFinanceStore.subscribe((state) => {
      if (!ready.current) return;
      if (!canSave.current) return; // <- BLOQUEIA autosave quando load falhou

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