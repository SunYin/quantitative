import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CHART_SPECS,
  formatCandleTime,
  isChartRange,
  isLiveRange,
  parseYahooQuotes,
} from "./candles.ts";

test("1m still means one month, not one minute", () => {
  assert.equal(CHART_SPECS["1m"].interval, "1d");
  assert.equal(CHART_SPECS["1m"].sampleFallback, true);
  assert.equal(CHART_SPECS.intraday.interval, "1m");
  assert.equal(CHART_SPECS["1d"].interval, "5m");
});

test("intraday and one-day ranges never use a sample path", () => {
  assert.equal(CHART_SPECS.intraday.sampleFallback, false);
  assert.equal(CHART_SPECS["1d"].sampleFallback, false);
  assert.equal(CHART_SPECS["5d"].sampleFallback, false);
  assert.equal(isLiveRange("intraday"), true);
  assert.equal(isLiveRange("6m"), false);
  assert.equal(isChartRange("intraday"), true);
  assert.equal(isChartRange("tick"), false);
});

test("minute bars keep distinct clock times", () => {
  const candles = parseYahooQuotes(
    [
      { date: new Date("2026-09-04T01:31:00.000Z"), open: 10, high: 10.2, low: 9.9, close: 10.1, volume: 100 },
      { date: new Date("2026-09-04T01:32:00.000Z"), open: 10.1, high: 10.3, low: 10, close: 10.2, volume: 80 },
    ],
    "minute",
  );
  assert.equal(candles.length, 2);
  assert.notEqual(candles[0].time, candles[1].time);
  assert.match(candles[0].time, /T01:31/);
  const day = parseYahooQuotes([{ date: new Date("2026-09-04T01:31:00.000Z"), close: 10, open: 10, high: 10, low: 10, volume: 1 }], "day");
  assert.equal(day[0].time, "2026-09-04");
});

test("formatCandleTime does not collapse a session to one bar", () => {
  const a = formatCandleTime(new Date("2026-09-04T01:31:00.000Z"), "minute");
  const b = formatCandleTime(new Date("2026-09-04T01:32:00.000Z"), "minute");
  assert.notEqual(a, b);
});
