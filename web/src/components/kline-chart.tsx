"use client";

import { useMemo, useState } from "react";
import type { ChartPayload, ChartRange, Candle } from "@/lib/candles";
import { movingAverage } from "@/lib/candles";
import { client } from "@/lib/orpc";
import { SourceBadge } from "@/components/research";
import { useI18n } from "@/components/locale-provider";
import { numberLocale } from "@/i18n/config";

const RANGES: ChartRange[] = ["1m", "3m", "6m", "1y"];

export function KlineChart({ initial }: { initial: ChartPayload }) {
  const { locale, t } = useI18n();
  const [payload, setPayload] = useState(initial);
  const [hover, setHover] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  async function setRange(range: ChartRange) {
    if (range === payload.range || pending) return;
    setPending(true);
    try {
      const next = await client.stock.chart({ symbol: payload.symbol, range });
      setPayload(next);
      setHover(null);
    } finally {
      setPending(false);
    }
  }

  const asian = payload.market === "A" || payload.market === "HK";
  const upColor = asian ? "#f43f5e" : "#34d399";
  const downColor = asian ? "#34d399" : "#f43f5e";

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{t("chart.title")}</h2>
          <SourceBadge locale={locale} source={payload.source} />
        </div>
        <div className="flex gap-1">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => void setRange(range)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                payload.range === range ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {t(`chart.range.${range}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {payload.candles.length === 0
          ? t("chart.empty")
          : payload.source === "yahoo"
            ? t("chart.yahooHint")
            : t("chart.sampleHint")}{" "}
        {t("chart.notAdvice")}
      </p>
      <CandleSvg
        candles={payload.candles}
        upColor={upColor}
        downColor={downColor}
        hover={hover}
        onHover={setHover}
        pending={pending}
      />
      <Legend
        candle={payload.candles[hover ?? payload.candles.length - 1]}
        currency={payload.currency}
        locale={locale}
        upColor={upColor}
        downColor={downColor}
        asian={asian}
      />
    </section>
  );
}

function Legend({
  candle,
  currency,
  locale,
  upColor,
  downColor,
  asian,
}: {
  candle?: Candle;
  currency: string;
  locale: string;
  upColor: string;
  downColor: string;
  asian: boolean;
}) {
  const { t } = useI18n();
  if (!candle) return null;
  const up = candle.close >= candle.open;
  const fmt = (value: number) =>
    value.toLocaleString(numberLocale(locale as "zh-CN" | "zh-Hant" | "en"), { maximumFractionDigits: 2 });
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="tabular-nums text-foreground">{candle.time}</span>
      <span>
        O <span className="tabular-nums text-foreground">{fmt(candle.open)}</span>
      </span>
      <span>
        H <span className="tabular-nums text-foreground">{fmt(candle.high)}</span>
      </span>
      <span>
        L <span className="tabular-nums text-foreground">{fmt(candle.low)}</span>
      </span>
      <span>
        C{" "}
        <span className="tabular-nums" style={{ color: up ? upColor : downColor }}>
          {fmt(candle.close)} {currency}
        </span>
      </span>
      <span>
        V <span className="tabular-nums text-foreground">{candle.volume.toLocaleString(numberLocale(locale as "zh-CN"))}</span>
      </span>
      <span>
        {t("chart.ma5")} / {t("chart.ma20")}
      </span>
      <span>{asian ? t("chart.colorsCN") : t("chart.colorsUS")}</span>
    </div>
  );
}

function CandleSvg({
  candles,
  upColor,
  downColor,
  hover,
  onHover,
  pending,
}: {
  candles: Candle[];
  upColor: string;
  downColor: string;
  hover: number | null;
  onHover: (index: number | null) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  const ma5 = useMemo(() => movingAverage(candles, 5), [candles]);
  const ma20 = useMemo(() => movingAverage(candles, 20), [candles]);
  const layout = useMemo(() => layoutChart(candles), [candles]);

  if (candles.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-border/80 bg-card px-4 text-center text-sm text-muted-foreground">
        {t("chart.empty")}
      </div>
    );
  }

  const { width, priceH, volH, pad, minP, maxP, maxV, innerW } = layout;
  const height = pad.t + priceH + 12 + volH + pad.b;
  const barW = Math.max(2, (innerW / candles.length) * 0.7);

  function xOf(i: number) {
    return pad.l + ((i + 0.5) / candles.length) * innerW;
  }
  function yPrice(value: number) {
    return pad.t + ((maxP - value) / (maxP - minP || 1)) * priceH;
  }
  function yVol(value: number) {
    const top = pad.t + priceH + 12;
    return top + volH - (value / (maxV || 1)) * volH;
  }

  const maPath = (series: Array<number | null>) =>
    series
      .map((value, i) => (value == null ? "" : `${i === 0 || series[i - 1] == null ? "M" : "L"} ${xOf(i)} ${yPrice(value)}`))
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full rounded-lg border border-border/80 bg-card ${pending ? "opacity-60" : ""}`}
      role="img"
      onMouseLeave={() => onHover(null)}
      onMouseMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - box.left) / box.width) * width;
        const i = Math.min(candles.length - 1, Math.max(0, Math.round(((x - pad.l) / innerW) * candles.length - 0.5)));
        onHover(i);
      }}
    >
      {hover != null ? (
        <line
          x1={xOf(hover)}
          x2={xOf(hover)}
          y1={pad.t}
          y2={height - pad.b}
          stroke="currentColor"
          strokeOpacity="0.2"
        />
      ) : null}
      {candles.map((candle, i) => {
        const up = candle.close >= candle.open;
        const color = up ? upColor : downColor;
        const y1 = yPrice(Math.max(candle.open, candle.close));
        const y2 = yPrice(Math.min(candle.open, candle.close));
        const body = Math.max(1, y2 - y1);
        return (
          <g key={candle.time}>
            <line x1={xOf(i)} x2={xOf(i)} y1={yPrice(candle.high)} y2={yPrice(candle.low)} stroke={color} strokeWidth="1" />
            <rect x={xOf(i) - barW / 2} y={y1} width={barW} height={body} fill={color} />
            <rect
              x={xOf(i) - barW / 2}
              y={yVol(candle.volume)}
              width={barW}
              height={Math.max(1, pad.t + priceH + 12 + volH - yVol(candle.volume))}
              fill={color}
              opacity="0.45"
            />
          </g>
        );
      })}
      <path d={maPath(ma5)} fill="none" stroke="#38bdf8" strokeWidth="1.25" />
      <path d={maPath(ma20)} fill="none" stroke="#fbbf24" strokeWidth="1.25" />
    </svg>
  );
}

function layoutChart(candles: Candle[]) {
  const width = 920;
  const pad = { l: 8, r: 8, t: 12, b: 8 };
  const priceH = 240;
  const volH = 64;
  const innerW = width - pad.l - pad.r;
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const minP = Math.min(...lows);
  const maxP = Math.max(...highs);
  const padP = (maxP - minP) * 0.06 || maxP * 0.02;
  return {
    width,
    priceH,
    volH,
    pad,
    innerW,
    minP: minP - padP,
    maxP: maxP + padP,
    maxV: Math.max(...candles.map((c) => c.volume), 1),
  };
}
