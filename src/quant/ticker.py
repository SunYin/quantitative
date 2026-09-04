"""Ticker aliases for sample lookup. Does not scrape an exchange tape."""

from __future__ import annotations


def ticker_candidates(query: str) -> list[str]:
    raw = query.strip()
    if not raw:
        return []
    upper = raw.upper().replace(" ", "")
    out: list[str] = []
    seen: set[str] = set()

    def add(item: str) -> None:
        if item and item not in seen:
            seen.add(item)
            out.append(item)

    add(raw)
    add(upper)

    hk = None
    if upper.endswith(".HK"):
        digits = upper[: -len(".HK")]
        if digits.isdigit() and 1 <= len(digits) <= 5:
            hk = digits
    elif upper.isdigit() and 1 <= len(upper) <= 5:
        hk = upper
    if hk is not None:
        add(f"{int(hk)}.HK")
        add(f"{int(hk):04d}.HK")
        add(f"{int(hk):05d}.HK")

    digits6 = None
    suffix = None
    if len(upper) == 6 and upper.isdigit():
        digits6 = upper
    elif "." in upper:
        code, _, rest = upper.partition(".")
        if len(code) == 6 and code.isdigit() and rest in {"SS", "SZ", "BJ"}:
            digits6 = code
            suffix = rest
    if digits6:
        if suffix:
            add(f"{digits6}.{suffix}")
        else:
            if digits6.startswith(("6", "5", "9")):
                add(f"{digits6}.SS")
            if digits6.startswith(("0", "2", "3")):
                add(f"{digits6}.SZ")
            if digits6.startswith(("4", "8")):
                add(f"{digits6}.BJ")
            add(f"{digits6}.SS")
            add(f"{digits6}.SZ")
    return out
