"""
Market data service — Twelve Data primary, ccxt fallback.
"""
import json
import logging
from datetime import datetime
from typing import Optional

import ccxt.async_support as ccxt

from app.core.config import settings
from app.db.redis import get_redis
from app.services.twelvedata import (
    get_td_client, to_td_symbol, from_td_symbol, TIMEFRAME_MAP,
)

logger = logging.getLogger(__name__)

WATCHLIST = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
    "ADA/USDT", "DOT/USDT", "AVAX/USDT", "MATIC/USDT", "LINK/USDT",
    "LTC/USDT", "DOGE/USDT",
]

_exchange: Optional[ccxt.Exchange] = None


def _get_exchange() -> ccxt.Exchange:
    global _exchange
    if _exchange is None:
        Cls = getattr(ccxt, settings.EXCHANGE)
        _exchange = Cls({
            "apiKey": settings.API_KEY,
            "secret": settings.API_SECRET,
            "enableRateLimit": True,
        })
    return _exchange


# ── Public API ────────────────────────────────────────────────────────────────

async def get_ticker(symbol: str) -> dict:
    """Return full ticker dict, cached 5 s in Redis."""
    r = get_redis()
    cache_key = f"ticker:{symbol}"

    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    result: Optional[dict] = None

    # 1. Twelve Data
    if settings.TWELVEDATA_API_KEY:
        client = get_td_client(settings.TWELVEDATA_API_KEY)
        result = await client.get_quote(symbol)

    # 2. ccxt fallback
    if result is None:
        try:
            result = await _ccxt_ticker(symbol)
        except Exception as e:
            logger.warning(f"[MarketService] ccxt ticker fallback failed: {e}")

    if result is None:
        raise RuntimeError(f"No ticker data available for {symbol}")

    await r.setex(cache_key, 5, json.dumps(result))
    return result


async def get_ohlcv(symbol: str, timeframe: str = "15m", limit: int = 500) -> list[dict]:
    """Return OHLCV list, cached 30–60 s in Redis."""
    r = get_redis()
    td_interval = TIMEFRAME_MAP.get(timeframe, "15min")
    cache_key = f"ohlcv:td:{symbol}:{td_interval}:{limit}"

    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    data: list[dict] = []

    # 1. Twelve Data
    if settings.TWELVEDATA_API_KEY:
        client = get_td_client(settings.TWELVEDATA_API_KEY)
        data = await client.get_time_series(symbol, td_interval, limit)

    # 2. ccxt fallback
    if not data:
        try:
            data = await _ccxt_ohlcv(symbol, timeframe, limit)
        except Exception as e:
            logger.warning(f"[MarketService] ccxt ohlcv fallback failed: {e}")

    if data:
        ttl = 30 if timeframe in ("1m", "5m") else 60
        await r.setex(cache_key, ttl, json.dumps(data))

    return data


async def get_order_book(symbol: str, depth: int = 20) -> dict:
    """Order book — ccxt only (Twelve Data doesn't offer this endpoint)."""
    try:
        return await _ccxt_order_book(symbol, depth)
    except Exception as e:
        logger.warning(f"[MarketService] order book failed: {e}")
        return {
            "symbol": symbol.replace("/", ""),
            "bids": [],
            "asks": [],
            "spread": 0,
            "spreadPercent": 0,
            "timestamp": datetime.utcnow().isoformat(),
        }


async def get_top_symbols() -> list[str]:
    return WATCHLIST


# ── ccxt helpers ──────────────────────────────────────────────────────────────

async def _ccxt_ticker(symbol: str) -> dict:
    exchange = _get_exchange()
    raw = await exchange.fetch_ticker(symbol)
    return {
        "symbol":        symbol.replace("/", ""),
        "name":          symbol.split("/")[0],
        "price":         raw["last"] or 0,
        "change":        raw["change"] or 0,
        "changePercent": raw["percentage"] or 0,
        "volume":        raw["quoteVolume"] or 0,
        "high24h":       raw["high"] or 0,
        "low24h":        raw["low"] or 0,
        "bid":           raw.get("bid") or 0,
        "ask":           raw.get("ask") or 0,
    }


async def _ccxt_ohlcv(symbol: str, timeframe: str = "15m", limit: int = 500) -> list[dict]:
    exchange = _get_exchange()
    raw = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    return [
        {
            "time":   int(row[0] / 1000),
            "open":   row[1],
            "high":   row[2],
            "low":    row[3],
            "close":  row[4],
            "volume": row[5],
        }
        for row in raw
    ]


async def _ccxt_order_book(symbol: str, depth: int = 20) -> dict:
    r = get_redis()
    cache_key = f"orderbook:{symbol}:{depth}"
    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    exchange = _get_exchange()
    raw = await exchange.fetch_order_book(symbol, limit=depth)

    def process(entries: list) -> list[dict]:
        rows, total = [], 0.0
        for price, qty in entries[:depth]:
            total += qty
            rows.append({"price": price, "quantity": qty, "total": round(total, 4)})
        return rows

    bids = process(raw["bids"])
    asks = process(raw["asks"])
    spread = asks[0]["price"] - bids[0]["price"] if bids and asks else 0
    spread_pct = (spread / bids[0]["price"] * 100) if bids and spread else 0

    result = {
        "symbol":        symbol.replace("/", ""),
        "bids":          bids,
        "asks":          asks,
        "spread":        round(spread, 4),
        "spreadPercent": round(spread_pct, 4),
        "timestamp":     datetime.utcnow().isoformat(),
    }
    await r.setex(cache_key, 1, json.dumps(result))
    return result
