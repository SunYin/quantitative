from quant.industry import chain_mermaid
from quant.sample_data import get_chain, get_stock


def test_ai_mermaid_has_up_and_downstream():
    text = chain_mermaid(get_chain("AI"))
    assert "flowchart LR" in text
    assert "upstream" in text and "downstream" in text
    assert "全球半导体" in text
    assert "消费电子" in text or "本地生活" in text


def test_english_mermaid_uses_english_labels():
    text = chain_mermaid(get_chain("ai"), english=True)
    assert "Upstream" in text
    assert "Downstream" in text
    assert "Global Semiconductors" in text


def test_unlisted_ipo_is_still_not_a_stock():
    try:
        get_stock("星辰先进")
        raise AssertionError("IPO name must not resolve as a stock for charts")
    except KeyError:
        pass
