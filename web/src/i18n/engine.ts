import { snapshot } from "@/lib/data";
import { type Locale } from "./config";

type Catalog = {
  phrases?: Record<string, string>;
  fragments?: { src: string; en: string }[];
  s2hk?: Record<string, string>;
};

function catalog(): Catalog {
  return (snapshot as { i18n?: Catalog }).i18n ?? {};
}

function entityMap(): Record<string, string> {
  const names: Record<string, string> = {
    银行: "Banks",
    半导体: "Semiconductors",
    金融: "Financials",
    主要消费: "Consumer staples",
    信息技术: "Information technology",
    制造: "Industrials",
    "可选消费/科技": "Discretionary / tech",
    可选消费: "Consumer discretionary",
  };
  for (const stock of snapshot.briefs) {
    names[stock.name] = stock.name_en;
  }
  for (const industry of snapshot.industries) {
    names[industry.name] = industry.name_en;
    for (const member of industry.constituents ?? []) {
      names[member.name] = member.name_en;
    }
  }
  for (const chain of snapshot.chains ?? []) {
    names[chain.name] = chain.name_en;
    for (const layer of chain.layers) {
      names[layer.industry] = layer.industry_en;
    }
  }
  for (const deal of snapshot.ipos ?? []) {
    names[deal.name] = deal.name_en;
  }
  names["医药"] = "Healthcare";
  names["能源"] = "Energy";
  names["公用事业"] = "Utilities";
  return names;
}

let _entities: Record<string, string> | null = null;
function entities(): Record<string, string> {
  _entities ??= entityMap();
  return _entities;
}

export function toHant(text: string): string {
  const table = catalog().s2hk ?? {};
  return Array.from(text, (ch) => table[ch] ?? ch).join("");
}

export function translate(locale: Locale, text: string): string {
  if (!text || locale === "zh-CN") return text;
  if (locale === "zh-Hant") return toHant(text);
  const phrases = catalog().phrases ?? {};
  if (phrases[text]) return phrases[text];
  const named = entities();
  if (named[text]) return named[text];
  let out = text;
  const pairs = [
    ...Object.entries(phrases),
    ...(catalog().fragments ?? []).map((item) => [item.src, item.en] as const),
  ].sort((a, b) => b[0].length - a[0].length);
  for (const [src, dst] of pairs) {
    if (src && out.includes(src)) out = out.replaceAll(src, dst);
  }
  for (const [src, dst] of Object.entries(named).sort((a, b) => b[0].length - a[0].length)) {
    if (src.length < 2) continue;
    if (out.includes(src)) out = out.replaceAll(src, dst);
  }
  return out;
}

export function displayName(locale: Locale, name: string, nameEn?: string): string {
  if (locale === "en") return nameEn || translate("en", name);
  return translate(locale, name);
}

export function cycleLabel(locale: Locale, value: string): string {
  if (locale === "en") return value;
  return translate(locale, value);
}
