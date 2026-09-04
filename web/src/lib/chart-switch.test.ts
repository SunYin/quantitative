import assert from "node:assert/strict";
import { test } from "node:test";
import { isLatestChartGeneration, startChartGeneration } from "./chart-switch.ts";

test("a later range click discards an in-flight poll or older click", () => {
  let gen = 0;
  const pollStarted = startChartGeneration(gen, "poll");
  gen = startChartGeneration(gen, "click");
  const secondClick = startChartGeneration(gen, "click");
  gen = secondClick;
  assert.equal(isLatestChartGeneration(pollStarted, gen), false);
  assert.equal(isLatestChartGeneration(secondClick, gen), true);
});

test("polls do not bump generation so they cannot steal a click", () => {
  let gen = startChartGeneration(0, "click");
  const clickStarted = gen;
  const pollStarted = startChartGeneration(gen, "poll");
  assert.equal(pollStarted, clickStarted);
  gen = startChartGeneration(gen, "click");
  assert.equal(isLatestChartGeneration(pollStarted, gen), false);
  assert.equal(isLatestChartGeneration(clickStarted, gen), false);
});
