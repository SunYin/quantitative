"""Multi-market equity research framework for A-shares, Hong Kong, US, and Stock Connect."""

from quant.models import (
    Financials,
    IndustrySnapshot,
    Market,
    ResearchReport,
    Stock,
)
from quant.scorecard import build_universe_scorecard, render_html, render_markdown
from quant.strategies import run_all_strategies

__all__ = [
    "Financials",
    "IndustrySnapshot",
    "Market",
    "ResearchReport",
    "Stock",
    "build_universe_scorecard",
    "render_html",
    "render_markdown",
    "run_all_strategies",
]
__version__ = "0.1.0"
