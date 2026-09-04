"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { findSampleTicker, suggestTickers, type TickerHit } from "@/lib/ticker";
import { useI18n } from "@/components/locale-provider";

export function TickerSearch({
  samples,
  size = "header",
}: {
  samples: TickerHit[];
  size?: "header" | "page";
}) {
  const { t, name } = useI18n();
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => suggestTickers(query, samples, 8), [query, samples]);

  function go(raw: string) {
    const q = raw.trim();
    if (!q) return;
    const hit = findSampleTicker(q, samples);
    setOpen(false);
    router.push(`/stocks/${encodeURIComponent(hit?.symbol ?? q)}`);
  }

  return (
    <form
      className={size === "header" ? "relative min-w-[12rem] max-w-sm flex-1" : "relative w-full max-w-xl"}
      onSubmit={(event) => {
        event.preventDefault();
        go(query);
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {t("search.label")}
      </label>
      <div className="flex gap-1">
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={t("search.placeholder")}
          autoComplete="off"
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        />
        <button type="submit" className="shrink-0 rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
          {t("search.submit")}
        </button>
      </div>
      {open && hits.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-background py-1 text-sm shadow-lg">
          {hits.map((hit) => (
            <li key={hit.symbol}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(hit.symbol);
                  go(hit.symbol);
                }}
              >
                <span>
                  {name(hit.name, hit.name_en)}{" "}
                  <span className="font-mono text-xs text-muted-foreground">{hit.symbol}</span>
                </span>
                <span className="text-xs text-muted-foreground">{hit.market}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
