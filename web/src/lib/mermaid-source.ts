import type { Locale } from "@/i18n/config";
import type { ValueChain } from "@/lib/data";

const ROLE_ORDER = ["upstream", "midstream", "downstream"] as const;

export function mermaidForChain(
  chain: Pick<ValueChain, "layers">,
  locale: Locale,
  roleLabel: (role: string) => string,
  nameOf: (zh: string, en?: string) => string,
): string {
  const grouped: Record<string, typeof chain.layers> = {
    upstream: [],
    midstream: [],
    downstream: [],
  };
  for (const layer of chain.layers) {
    (grouped[layer.role] ??= []).push(layer);
  }
  const occupied = ROLE_ORDER.filter((role) => (grouped[role] ?? []).length > 0);
  const lines = ["flowchart LR"];
  occupied.forEach((role) => {
    lines.push(`  subgraph ${role}["${escapeLabel(roleLabel(role))}"]`);
    grouped[role].forEach((layer) => {
      const id = `n${chain.layers.indexOf(layer)}`;
      const label = nameOf(layer.industry, layer.industry_en);
      const flag = layer.bottleneck ? (locale === "en" ? "<br/>bottleneck" : "<br/>瓶颈") : "";
      lines.push(`    ${id}["${escapeLabel(label)}${flag}"]`);
    });
    lines.push("  end");
  });
  if (occupied.length === 1) {
    const items = grouped[occupied[0]];
    for (let i = 0; i < items.length - 1; i++) {
      lines.push(`  n${chain.layers.indexOf(items[i])} -.-> n${chain.layers.indexOf(items[i + 1])}`);
    }
  } else {
    for (let i = 0; i < chain.layers.length - 1; i++) {
      lines.push(`  n${i} --> n${i + 1}`);
    }
  }
  chain.layers.forEach((layer, index) => {
    const href = `/industries/${encodeURIComponent(layer.industry)}`;
    lines.push(`  click n${index} "${href}" _self`);
  });
  return lines.join("\n");
}

function escapeLabel(text: string): string {
  return text.replaceAll('"', "#quot;").replaceAll("]", "﹚").replaceAll("[", "﹙");
}
