"use client";

import { useEffect, useId, useRef } from "react";
import type { ValueChain } from "@/lib/data";
import { mermaidForChain } from "@/lib/mermaid-source";
import { useI18n } from "@/components/locale-provider";

let mermaidReady = false;

export function ChainMermaid({ chain, compact = false }: { chain: ValueChain; compact?: boolean }) {
  const { locale, t, name } = useI18n();
  const rawId = useId().replaceAll(":", "");
  const ref = useRef<HTMLDivElement>(null);
  const definition = mermaidForChain(chain, locale, (role) => t(`role.${role}`), name);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    void (async () => {
      const mermaid = (await import("mermaid")).default;
      if (!mermaidReady) {
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "inherit",
          flowchart: { htmlLabels: true, curve: "basis", padding: 12 },
          themeVariables: {
            primaryColor: "#1e293b",
            primaryTextColor: "#e5e7eb",
            primaryBorderColor: "#38bdf8",
            lineColor: "#64748b",
            secondaryColor: "#3f2d1d",
            tertiaryColor: "#111827",
            clusterBkg: "#171717",
            clusterBorder: "#525252",
          },
        });
        mermaidReady = true;
      }
      try {
        const { svg, bindFunctions } = await mermaid.render(`mmd_${rawId}_${chain.id}`, definition);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        bindFunctions?.(ref.current);
      } catch {
        if (!cancelled && ref.current) {
          ref.current.textContent = definition;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chain.id, definition, rawId]);

  return (
    <div className="space-y-2">
      <div
        ref={ref}
        className={`chain-mermaid overflow-x-auto rounded-lg border border-border/80 bg-card px-3 py-4 ${compact ? "min-h-32" : "min-h-48"}`}
      />
      <p className="text-xs text-muted-foreground">{t("chain.mermaidHint")}</p>
    </div>
  );
}
