/** Click starts a new generation; in-flight polls keep the current one. */
export function startChartGeneration(current: number, kind: "click" | "poll"): number {
  return kind === "click" ? current + 1 : current;
}

export function isLatestChartGeneration(started: number, current: number): boolean {
  return started === current;
}
