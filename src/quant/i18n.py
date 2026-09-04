"""Locale helpers. Scoring stays in Chinese; this layer is display-only."""

from __future__ import annotations

import re
from contextvars import ContextVar

from quant.i18n_catalog import FRAGMENTS, PHRASES, S2HK_FROM, S2HK_TO

LOCALES = ("zh-CN", "zh-Hant", "en")
DEFAULT_LOCALE = "zh-CN"
_CJK = re.compile(r"[\u4e00-\u9fff]")
_locale: ContextVar[str] = ContextVar("quant_locale", default=DEFAULT_LOCALE)
S2HK = dict(zip(S2HK_FROM, S2HK_TO, strict=True))

_ALIASES = {
    "zh": "zh-CN",
    "zh-cn": "zh-CN",
    "zh_cn": "zh-CN",
    "zh-sg": "zh-CN",
    "cn": "zh-CN",
    "zh-hant": "zh-Hant",
    "zh_hant": "zh-Hant",
    "zh-hk": "zh-Hant",
    "zh_hk": "zh-Hant",
    "zh-tw": "zh-Hant",
    "zh_tw": "zh-Hant",
    "zh-mo": "zh-Hant",
    "hant": "zh-Hant",
    "hk": "zh-Hant",
    "tw": "zh-Hant",
    "en": "en",
    "en-us": "en",
    "en_us": "en",
    "en-gb": "en",
    "english": "en",
}

_FRAGMENT_EN = tuple(sorted(FRAGMENTS, key=lambda kv: len(kv[0]), reverse=True))
_PHRASE_EN = tuple(sorted(PHRASES.items(), key=lambda kv: len(kv[0]), reverse=True))
_ALL_EN = tuple(sorted((*PHRASES.items(), *FRAGMENTS), key=lambda kv: len(kv[0]), reverse=True))


def normalize_locale(value: str | None) -> str:
    if not value:
        return DEFAULT_LOCALE
    key = value.strip().replace("_", "-")
    lower = key.lower()
    if lower in _ALIASES:
        return _ALIASES[lower]
    if lower.startswith("zh-hant") or lower.startswith("zh-hk") or lower.startswith("zh-tw"):
        return "zh-Hant"
    if lower.startswith("en"):
        return "en"
    if lower.startswith("zh"):
        return "zh-CN"
    return DEFAULT_LOCALE


def current_locale() -> str:
    return _locale.get()


def set_locale(locale: str) -> str:
    resolved = normalize_locale(locale)
    _locale.set(resolved)
    return resolved


def html_lang(locale: str | None = None) -> str:
    loc = normalize_locale(locale or current_locale())
    return {"zh-CN": "zh-CN", "zh-Hant": "zh-HK", "en": "en"}[loc]


def number_locale(locale: str | None = None) -> str:
    loc = normalize_locale(locale or current_locale())
    return {"zh-CN": "zh-CN", "zh-Hant": "zh-HK", "en": "en-US"}[loc]


def to_hant(text: str) -> str:
    return "".join(S2HK.get(ch, ch) for ch in text)


def entity_en() -> dict[str, str]:
    from quant.sample_data import CHAINS, INDUSTRIES, STOCKS, ipos

    names: dict[str, str] = {}
    for stock in STOCKS.values():
        names[stock.name] = stock.name_en
    for item in INDUSTRIES.values():
        names[item.name] = item.name_en
    for chain in CHAINS.values():
        names[chain.name] = chain.name_en
    for deal in ipos():
        names[deal.name] = deal.name_en
    names.setdefault("银行", "Banks")
    names.setdefault("半导体", "Semiconductors")
    names.setdefault("金融", "Financials")
    names.setdefault("主要消费", "Consumer staples")
    names.setdefault("信息技术", "Information technology")
    names.setdefault("制造", "Industrials")
    names.setdefault("可选消费", "Consumer discretionary")
    names.setdefault("可选消费/科技", "Discretionary / tech")
    names.setdefault("医药", "Healthcare")
    names.setdefault("能源", "Energy")
    names.setdefault("公用事业", "Utilities")
    return names


def translate(text: str, locale: str | None = None) -> str:
    if not text:
        return text
    loc = normalize_locale(locale or current_locale())
    if loc == "zh-CN":
        return text
    if loc == "zh-Hant":
        return to_hant(text)
    exact = PHRASES.get(text)
    if exact:
        return exact
    entities = entity_en()
    if text in entities:
        return entities[text]
    out = text
    for src, dst in _ALL_EN:
        if src in out:
            out = out.replace(src, dst)
    for src, dst in sorted(entities.items(), key=lambda kv: len(kv[0]), reverse=True):
        if len(src) < 2:
            continue
        if src in out:
            out = out.replace(src, dst)
    return out


def translate_tree(value, locale: str | None = None):
    loc = normalize_locale(locale or current_locale())
    if isinstance(value, str):
        return translate(value, loc)
    if isinstance(value, list):
        return [translate_tree(item, loc) for item in value]
    if isinstance(value, tuple):
        return type(value)(translate_tree(item, loc) for item in value)
    if isinstance(value, dict):
        skip = {"id", "market", "currency", "grade", "as_of", "published", "rating", "board"}
        out = {}
        for key, item in value.items():
            if key == "i18n" or key.endswith("_en"):
                out[key] = item
            elif key == "symbol" and isinstance(item, str) and not remaining_cjk(item):
                out[key] = item
            elif key in skip:
                out[key] = item
            else:
                out[key] = translate_tree(item, loc)
        return out
    return value


def catalog_payload() -> dict:
    return {
        "locales": list(LOCALES),
        "default": DEFAULT_LOCALE,
        "phrases": dict(PHRASES),
        "fragments": [{"src": src, "en": dst} for src, dst in _FRAGMENT_EN],
        "s2hk": S2HK,
    }


def remaining_cjk(text: str) -> str:
    return "".join(ch for ch in text if _CJK.match(ch))
