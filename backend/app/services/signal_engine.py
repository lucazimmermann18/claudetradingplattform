"""
AI Signal Engine - Technical Analysis based trading signals.
Uses TA-Lib indicators: RSI, MACD, Bollinger Bands, EMA crossovers, Volume analysis.
"""
import asyncio
import uuid
import json
import logging
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd

from app.services.market_service import get_ohlcv
from app.db.redis import get_redis

logger = logging.getLogger(__name__)

WATCHLIST = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
    "ADA/USDT", "AVAX/USDT", "DOT/USDT", "LINK/USDT", "MATIC/USDT",
]


def calc_rsi(closes: np.ndarray, period: int = 14) -> float:
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def calc_ema(closes: np.ndarray, period: int) -> np.ndarray:
    k = 2 / (period + 1)
    ema = np.zeros(len(closes))
    ema[period - 1] = np.mean(closes[:period])
    for i in range(period, len(closes)):
        ema[i] = closes[i] * k + ema[i - 1] * (1 - k)
    return ema


def calc_macd(closes: np.ndarray) -> tuple[float, float, float]:
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    macd_line = ema12 - ema26
    signal_line = calc_ema(macd_line[25:], 9)
    macd = round(float(macd_line[-1]), 4)
    signal = round(float(signal_line[-1]), 4)
    histogram = round(macd - signal, 4)
    return macd, signal, histogram


def calc_bollinger(closes: np.ndarray, period: int = 20, mult: float = 2.0) -> tuple[float, float, float]:
    sma = np.mean(closes[-period:])
    std = np.std(closes[-period:])
    return round(sma + mult * std, 4), round(sma, 4), round(sma - mult * std, 4)


def analyze(symbol: str, ohlcv: list[dict], timeframe: str = "15m") -> Optional[dict]:
    if len(ohlcv) < 60:
        return None

    df = pd.DataFrame(ohlcv)
    closes = df["close"].values
    volumes = df["volume"].values
    highs = df["high"].values
    lows = df["low"].values

    current_price = float(closes[-1])

    # Indicators
    rsi = calc_rsi(closes)
    macd, macd_signal, macd_hist = calc_macd(closes)
    bb_upper, bb_middle, bb_lower = calc_bollinger(closes)

    ema20 = calc_ema(closes, 20)
    ema50 = calc_ema(closes, 50)
    ema200 = calc_ema(closes, 200)

    ema20_cur = float(ema20[-1])
    ema50_cur = float(ema50[-1])
    ema200_cur = float(ema200[-1])

    # Volume analysis
    avg_volume = float(np.mean(volumes[-20:]))
    current_volume = float(volumes[-1])
    volume_surge = current_volume > avg_volume * 1.5

    # Scoring system
    buy_score = 0
    sell_score = 0
    reasons = []

    # RSI
    if rsi < 30:
        buy_score += 30
        reasons.append(f"RSI oversold ({rsi:.1f})")
    elif rsi < 40:
        buy_score += 15
        reasons.append(f"RSI approaching oversold ({rsi:.1f})")
    elif rsi > 70:
        sell_score += 30
        reasons.append(f"RSI overbought ({rsi:.1f})")
    elif rsi > 60:
        sell_score += 15
        reasons.append(f"RSI approaching overbought ({rsi:.1f})")

    # MACD
    if macd > macd_signal and macd_hist > 0:
        buy_score += 20
        reasons.append("MACD bullish crossover")
    elif macd < macd_signal and macd_hist < 0:
        sell_score += 20
        reasons.append("MACD bearish crossover")

    # EMA trend
    if current_price > ema20_cur > ema50_cur:
        buy_score += 15
        reasons.append("Price above EMA20 > EMA50 (uptrend)")
    elif current_price < ema20_cur < ema50_cur:
        sell_score += 15
        reasons.append("Price below EMA20 < EMA50 (downtrend)")

    if current_price > ema200_cur:
        buy_score += 10
        reasons.append("Price above EMA200 (long-term bull)")
    else:
        sell_score += 10
        reasons.append("Price below EMA200 (long-term bear)")

    # Bollinger Bands
    if current_price < bb_lower:
        buy_score += 20
        reasons.append("Price below lower Bollinger Band (oversold)")
    elif current_price > bb_upper:
        sell_score += 20
        reasons.append("Price above upper Bollinger Band (overbought)")

    # Volume confirmation
    if volume_surge:
        dominant_score = max(buy_score, sell_score)
        if dominant_score == buy_score:
            buy_score += 5
            reasons.append("High volume confirms bullish momentum")
        else:
            sell_score += 5
            reasons.append("High volume confirms bearish momentum")

    total = buy_score + sell_score
    if total == 0:
        return None

    if buy_score > sell_score and buy_score >= 35:
        signal_type = "BUY"
        confidence = min(95, int((buy_score / max(total, 1)) * 100 + 15))
        target = round(current_price * 1.03, 4)
        stop = round(current_price * 0.985, 4)
    elif sell_score > buy_score and sell_score >= 35:
        signal_type = "SELL"
        confidence = min(95, int((sell_score / max(total, 1)) * 100 + 15))
        target = round(current_price * 0.97, 4)
        stop = round(current_price * 1.015, 4)
    else:
        signal_type = "NEUTRAL"
        confidence = 50
        target = None
        stop = None

    return {
        "id": str(uuid.uuid4()),
        "symbol": symbol.replace("/", ""),
        "type": signal_type,
        "confidence": confidence,
        "price": current_price,
        "targetPrice": target,
        "stopLoss": stop,
        "reasoning": " | ".join(reasons[:3]) if reasons else "Insufficient signal strength",
        "indicators": {
            "rsi": rsi,
            "macd": macd,
            "macdSignal": macd_signal,
            "ema20": round(ema20_cur, 4),
            "ema50": round(ema50_cur, 4),
            "bollinger": {"upper": bb_upper, "middle": bb_middle, "lower": bb_lower},
            "volume": round(current_volume, 2),
        },
        "timeframe": timeframe,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def analyze_with_ai(symbol: str, ohlcv: list[dict], timeframe: str = "15m") -> Optional[dict]:
    """Try AI-enhanced analysis, fall back to technical analysis."""
    from app.services.ai_providers import get_active_provider_config, call_ai_provider

    # Always compute base indicators first
    base = analyze(symbol, ohlcv, timeframe)

    provider_cfg = await get_active_provider_config()
    if not provider_cfg:
        return base  # No AI configured — use pure TA

    provider, api_key, model = provider_cfg

    if len(ohlcv) < 60:
        return base

    df = pd.DataFrame(ohlcv)
    closes = df["close"].values
    volumes = df["volume"].values

    rsi = calc_rsi(closes)
    macd, macd_signal, macd_hist = calc_macd(closes)
    bb_upper, bb_middle, bb_lower = calc_bollinger(closes)
    ema20 = float(calc_ema(closes, 20)[-1])
    ema50 = float(calc_ema(closes, 50)[-1])
    ema200 = float(calc_ema(closes, 200)[-1])
    avg_vol = float(np.mean(volumes[-20:]))
    cur_vol = float(volumes[-1])

    indicators = {
        "price": float(closes[-1]),
        "rsi": rsi, "macd": macd, "macd_signal": macd_signal, "macd_hist": macd_hist,
        "bb_upper": bb_upper, "bb_middle": bb_middle, "bb_lower": bb_lower,
        "ema20": ema20, "ema50": ema50, "ema200": ema200,
        "volume_ratio": cur_vol / avg_vol if avg_vol > 0 else 1.0,
    }

    ai_result = await call_ai_provider(provider, api_key, model, symbol, timeframe, indicators, ohlcv)

    if not ai_result:
        logger.warning(f"[AI] {symbol}: AI call failed, using TA fallback")
        return base

    current_price = float(closes[-1])
    signal_type = ai_result["signal"]
    confidence = ai_result["confidence"]

    # Merge AI result with computed indicators
    return {
        "id": str(uuid.uuid4()),
        "symbol": symbol.replace("/", ""),
        "type": signal_type,
        "confidence": confidence,
        "price": current_price,
        "targetPrice": ai_result.get("targetPrice"),
        "stopLoss": ai_result.get("stopLoss"),
        "reasoning": f"[{provider.upper()} {model}] {ai_result.get('reasoning', '')}",
        "indicators": {
            "rsi": round(rsi, 2),
            "macd": round(macd, 4),
            "macdSignal": round(macd_signal, 4),
            "ema20": round(ema20, 4),
            "ema50": round(ema50, 4),
            "volume": round(cur_vol, 2),
        },
        "timeframe": timeframe,
        "timestamp": datetime.utcnow().isoformat(),
        "aiProvider": provider,
    }


async def run_signal_engine(websocket_manager=None):
    """Background task: analyzes all watchlist symbols every 60s."""
    from app.services.market_service import get_ohlcv

    logger.info("[SignalEngine] Starting...")
    r = get_redis()

    while True:
        for symbol in WATCHLIST:
            try:
                ohlcv = await get_ohlcv(symbol, "15m", 300)
                signal = await analyze_with_ai(symbol, ohlcv, "15m")
                if signal and signal["type"] != "NEUTRAL":
                    await r.setex(f"signal:{symbol}", 300, json.dumps(signal))
                    if websocket_manager:
                        await websocket_manager.broadcast({"type": "signal", "data": signal})
                    logger.info(f"[Signal] {symbol}: {signal['type']} ({signal['confidence']}%)")
            except Exception as e:
                logger.warning(f"[SignalEngine] {symbol} failed: {e}")

        await asyncio.sleep(60)
