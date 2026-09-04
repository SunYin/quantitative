"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartPayload, ChartRange, Candle } from "@/lib/candles";
import { CHART_SPECS, isLiveRange, movingAverage } from "@/lib/candles";
import { isLatestChartGeneration, startChartGeneration } from "@/lib/chart-switch";
import { client } from "@/lib/orpc";
import { ChangePct, SourceBadge } from "@/components/research";
import { useI18n } from "@/components/locale-provider";
import { numberLocale } from "@/i18n/config";

const SESSION_RANGES: ChartRange[] = ["intraday", "1d", "5d"];
const HISTORY_RANGES: ChartRange[] = ["1m", "3m", "6m", "1y", "5y"];

export function KlineChart({ initial }: { initial: ChartPayload }) {
  const { locale, t } = useI18n();
  const [payload, setPayload] = useState(initial);
  const [selectedRange, setSelectedRange] = useState<ChartRange>(initial.range);
  const [hover, setHover] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  async function load(range: ChartRange, silent = false) {
    const gen = startChartGeneration(genRef.current, silent ? "poll" : "click");
    genRef.current = silent ? genRef.current : gen;
    if (!silent) {
      setSelectedRange(range);
      setPending(true);
      setError(null);
    }
    try {
      const next = await client.stock.chart({ symbol: payloadRef.current.symbol, range });
      if (!isLatestChartGeneration(gen, genRef.current)) return;
      setPayload(next);
      setSelectedRange(next.range);
      setError(null);
      if (!silent) setHover(null);
    } catch {
      if (!isLatestChartGeneration(gen, genRef.current)) return;
      if (!silent) {
        setSelectedRange(payloadRef.current.range);
        setError(t("chart.switchFailed"));
      }
    } finally {
      if (!silent && isLatestChartGeneration(gen, genRef.current)) setPending(false);
    }
  }

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!isLiveRange(selectedRange)) return;
    const range = selectedRange;
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void loadRef.current(range, true);
    }, 20_000);
    return () => window.clearInterval(id);
  }, [selectedRange]);

  const asian = payload.market === "A" || payload.market === "HK";
  const upColor = asian ? "#f43f5e" : "#34d399";
  const downColor = asian ? "#34d399" : "#f43f5e";
  const spec = CHART_SPECS[payload.range];
  const hint =
    error ??
    (pending && selectedRange !== payload.range
      ? t("chart.switching")
      : payload.candles.length === 0
        ? isLiveRange(payload.range)
          ? t("chart.emptyLive")
          : t("chart.empty")
        : payload.source === "yahoo"
          ? isLiveRange(payload.range)
            ? t("chart.yahooLiveHint")
            : t("chart.yahooHint")
          : t("chart.sampleHint"));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {selectedRange === "intraday" ? t("chart.title.intraday") : t("chart.title")}
          </h2>
          <SourceBadge locale={locale} source={payload.source} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <RangeRow
            ranges={SESSION_RANGES}
            current={selectedRange}
            pending={pending}
            onPick={(range) => void load(range)}
          />
          <RangeRow
            ranges={HISTORY_RANGES}
            current={selectedRange}
            pending={pending}
            onPick={(range) => void load(range)}
          />
        </div>
      </div>
      {payload.lastPrice != null ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-2xl font-semibold tabular-nums">
            {payload.lastPrice.toLocaleString(numberLocale(locale), { maximumFractionDigits: 2 })}{" "}
            <span className="text-sm font-normal text-muted-foreground">{payload.currency}</span>
          </span>
          <ChangePct value={payload.changePct} />
          {payload.asOf ? (
            <span className="text-xs text-muted-foreground">
              {t("chart.asOf")} {payload.asOf}
            </span>
          ) : null}
          {isLiveRange(selectedRange) ? (
            <span className="text-xs text-emerald-300/80">{t("chart.livePoll")}</span>
          ) : null}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {hint} {t("chart.notAdvice")}
      </p>
      <ChartSvg
        candles={payload.candles}
        style={spec.style}
        previousClose={payload.previousClose}
        showMa={spec.style === "candle" && spec.precision === "day"}
        upColor={upColor}
        downColor={downColor}
        hover={hover}
        onHover={setHover}
        pending={pending}
      />
      <Legend
        candle={payload.candles[hover ?? payload.candles.length - 1]}
        range={payload.range}
        style={spec.style}
        currency={payload.currency}
        locale={locale}
        upColor={upColor}
        downColor={downColor}
        asian={asian}
        showMa={spec.style === "candle" && spec.precision === "day"}
      />
    </section>
  );
}

function RangeRow({
  ranges,
  current,
  pending,
  onPick,
}: {
  ranges: ChartRange[];
  current: ChartRange;
  pending: boolean;
  onPick: (range: ChartRange) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {ranges.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onPick(range)}
          aria-pressed={current === range}
          className={`rounded-md px-2.5 py-1 text-xs ${
            current === range ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
          }`}
        >
          {t(`chart.range.${range}`)}
          {pending && current === range ? "…" : ""}
        </button>
      ))}
    </div>
  );
}

function Legend({
  candle,
  range,
  style,
  currency,
  locale,
  upColor,
  downColor,
  asian,
  showMa,
}: {
  candle?: Candle;
  range: ChartRange;
  style: "line" | "candle";
  currency: string;
  locale: string;
  upColor: string;
  downColor: string;
  asian: boolean;
  showMa: boolean;
}) {
  const { t } = useI18n();
  if (!candle) return null;
  const up = candle.close >= candle.open;
  const fmt = (value: number) =>
    value.toLocaleString(numberLocale(locale as "zh-CN" | "zh-Hant" | "en"), { maximumFractionDigits: 2 });
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="tabular-nums text-foreground">{formatLegendTime(candle.time, range, locale)}</span>
      {style === "candle" ? (
        <>
          <span>
            O <span className="tabular-nums text-foreground">{fmt(candle.open)}</span>
          </span>
          <span>
            H <span className="tabular-nums text-foreground">{fmt(candle.high)}</span>
          </span>
          <span>
            L <span className="tabular-nums text-foreground">{fmt(candle.low)}</span>
          </span>
        </>
      ) : null}
      <span>
        {style === "line" ? t("chart.last") : "C"}{" "}
        <span className="tabular-nums" style={{ color: up ? upColor : downColor }}>
          {fmt(candle.close)} {currency}
        </span>
      </span>
      <span>
        V <span className="tabular-nums text-foreground">{candle.volume.toLocaleString(numberLocale(locale as "zh-CN"))}</span>
      </span>
      {showMa ? (
        <span>
          {t("chart.ma5")} / {t("chart.ma20")}
        </span>
      ) : null}
      <span>{asian ? t("chart.colorsCN") : t("chart.colorsUS")}</span>
    </div>
  );
}

function ChartSvg({
  candles,
  style,
  previousClose,
  showMa,
  upColor,
  downColor,
  hover,
  onHover,
  pending,
}: {
  candles: Candle[];
  style: "line" | "candle";
  previousClose: number | null;
  showMa: boolean;
  upColor: string;
  downColor: string;
  hover: number | null;
  onHover: (index: number | null) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  const ma5 = useMemo(() => movingAverage(candles, 5), [candles]);
  const ma20 = useMemo(() => movingAverage(candles, 20), [candles]);
  const layout = useMemo(() => layoutChart(candles, previousClose), [candles, previousClose]);

  if (candles.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-border/80 bg-card px-4 text-center text-sm text-muted-foreground">
        {t("chart.empty")}
      </div>
    );
  }

  const { width, priceH, volH, pad, minP, maxP, maxV, innerW } = layout;
  const height = pad.t + priceH + 12 + volH + pad.b;
  const barW = Math.max(style === "line" ? 1 : 2, (innerW / candles.length) * (style === "line" ? 0.55 : 0.7));
  const last = candles[candles.length - 1];
  const lineUp = previousClose != null ? last.close >= previousClose : last.close >= last.open;
  const lineColor = lineUp ? upColor : downColor;

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
  const closePath = candles.map((candle, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yPrice(candle.close)}`).join(" ");

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
      {previousClose != null ? (
        <line
          x1={pad.l}
          x2={width - pad.r}
          y1={yPrice(previousClose)}
          y2={yPrice(previousClose)}
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeDasharray="4 3"
        />
      ) : null}
      {style === "line" ? <path d={closePath} fill="none" stroke={lineColor} strokeWidth="1.75" /> : null}
      {candles.map((candle, i) => {
        const up = candle.close >= candle.open;
        const color = up ? upColor : downColor;
        const y1 = yPrice(Math.max(candle.open, candle.close));
        const y2 = yPrice(Math.min(candle.open, candle.close));
        const body = Math.max(1, y2 - y1);
        return (
          <g key={`${candle.time}-${i}`}>
            {style === "candle" ? (
              <>
                <line x1={xOf(i)} x2={xOf(i)} y1={yPrice(candle.high)} y2={yPrice(candle.low)} stroke={color} strokeWidth="1" />
                <rect x={xOf(i) - barW / 2} y={y1} width={barW} height={body} fill={color} />
              </>
            ) : null}
            <rect
              x={xOf(i) - barW / 2}
              y={yVol(candle.volume)}
              width={barW}
              height={Math.max(1, pad.t + priceH + 12 + volH - yVol(candle.volume))}
              fill={style === "line" ? lineColor : color}
              opacity="0.45"
            />
          </g>
        );
      })}
      {showMa ? (
        <>
          <path d={maPath(ma5)} fill="none" stroke="#38bdf8" strokeWidth="1.25" />
          <path d={maPath(ma20)} fill="none" stroke="#fbbf24" strokeWidth="1.25" />
        </>
      ) : null}
    </svg>
  );
}

function layoutChart(candles: Candle[], previousClose: number | null) {
  const width = 920;
  const pad = { l: 8, r: 8, t: 12, b: 8 };
  const priceH = 240;
  const volH = 64;
  const innerW = width - pad.l - pad.r;
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  if (previousClose != null) {
    highs.push(previousClose);
    lows.push(previousClose);
  }
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

function formatLegendTime(time: string, range: ChartRange, locale: string) {
  if (!isLiveRange(range)) return time;
  const iso = time.includes("T") ? time : `${time}T00:00:00Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return time;
  return date.toLocaleString(numberLocale(locale as "zh-CN" | "zh-Hant" | "en"), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
