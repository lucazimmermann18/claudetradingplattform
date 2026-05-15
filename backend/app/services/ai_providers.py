"""
AI Provider abstraction — supports Claude (Anthropic), OpenAI, DeepSeek.
The active provider is configured via the admin API and stored in the database.
"""
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

PROVIDER_MODELS = {
    "claude":   ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    "openai":   ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    "deepseek": ["deepseek-chat", "deepseek-reasoner"],
}

DEFAULT_MODELS = {
    "claude":   "claude-sonnet-4-6",
    "openai":   "gpt-4o",
    "deepseek": "deepseek-chat",
}


def _build_prompt(symbol: str, timeframe: str, indicators: dict, recent_candles: list[dict]) -> str:
    candles_text = "\n".join(
        f"  {c['time']}: O={c['open']:.4f} H={c['high']:.4f} L={c['low']:.4f} C={c['close']:.4f} V={c['volume']:.0f}"
        for c in recent_candles[-5:]
    )
    return f"""You are an expert cryptocurrency trading analyst. Analyze the following market data and return a trading signal as JSON.

Symbol: {symbol}
Timeframe: {timeframe}
Current Price: {indicators['price']:.6f}

Technical Indicators:
- RSI (14): {indicators['rsi']:.2f}
- MACD Line: {indicators['macd']:.4f} | Signal: {indicators['macd_signal']:.4f} | Histogram: {indicators['macd_hist']:.4f}
- Bollinger Upper: {indicators['bb_upper']:.4f} | Middle: {indicators['bb_middle']:.4f} | Lower: {indicators['bb_lower']:.4f}
- EMA 20: {indicators['ema20']:.4f} | EMA 50: {indicators['ema50']:.4f} | EMA 200: {indicators['ema200']:.4f}
- Volume ratio (vs 20-day avg): {indicators['volume_ratio']:.2f}x

Recent candles (last 5):
{candles_text}

Respond ONLY with valid JSON in exactly this format:
{{
  "signal": "BUY" | "SELL" | "NEUTRAL",
  "confidence": <integer 0-100>,
  "reasoning": "<one concise sentence with key indicator readings>",
  "targetPrice": <number or null>,
  "stopLoss": <number or null>
}}"""


async def _call_claude(api_key: str, model: str, prompt: str) -> dict:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)
    msg = await client.messages.create(
        model=model,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    text = msg.content[0].text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


async def _call_openai(api_key: str, model: str, prompt: str, base_url: Optional[str] = None) -> dict:
    import openai
    client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
    resp = await client.chat.completions.create(
        model=model,
        max_tokens=512,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a professional crypto trading analyst. Always respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
    )
    return json.loads(resp.choices[0].message.content)


async def call_ai_provider(provider: str, api_key: str, model: str,
                            symbol: str, timeframe: str,
                            indicators: dict, recent_candles: list[dict]) -> Optional[dict]:
    """Call the configured AI provider and return parsed signal data."""
    prompt = _build_prompt(symbol, timeframe, indicators, recent_candles)
    try:
        if provider == "claude":
            result = await _call_claude(api_key, model, prompt)
        elif provider == "openai":
            result = await _call_openai(api_key, model, prompt)
        elif provider == "deepseek":
            result = await _call_openai(
                api_key, model, prompt,
                base_url="https://api.deepseek.com/v1"
            )
        else:
            return None

        # Validate required fields
        if "signal" not in result or result["signal"] not in ("BUY", "SELL", "NEUTRAL"):
            return None
        result["confidence"] = max(0, min(100, int(result.get("confidence", 60))))
        return result

    except Exception as e:
        logger.warning(f"[AI:{provider}] {symbol} failed: {e}")
        return None


async def get_active_provider_config() -> Optional[tuple[str, str, str]]:
    """Returns (provider, api_key, model) for the active AI provider, or None."""
    from app.db.database import AsyncSessionLocal
    from app.models.models import AIProviderConfig
    from sqlalchemy import select

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AIProviderConfig).where(AIProviderConfig.is_active == True)
            )
            cfg = result.scalar_one_or_none()
            if cfg:
                return cfg.provider, cfg.api_key, cfg.model or DEFAULT_MODELS.get(cfg.provider, "")
    except Exception as e:
        logger.warning(f"[AI] Could not load provider config: {e}")
    return None


async def test_provider(provider: str, api_key: str, model: str) -> bool:
    """Test if an API key works by sending a minimal request."""
    try:
        indicators = {"price": 1.0, "rsi": 50.0, "macd": 0.0, "macd_signal": 0.0, "macd_hist": 0.0,
                      "bb_upper": 1.1, "bb_middle": 1.0, "bb_lower": 0.9,
                      "ema20": 1.0, "ema50": 1.0, "ema200": 1.0, "volume_ratio": 1.0}
        result = await call_ai_provider(provider, api_key, model, "TESTUSDT", "15m", indicators, [])
        return result is not None
    except Exception:
        return False
