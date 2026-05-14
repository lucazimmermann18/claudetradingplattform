"""
Market data service using ccxt for exchange connectivity.
Supports any ccxt-compatible exchange (Binance, Bybit, Coinbase, etc.)
"""
import asyncio
import json
from datetime import datetime
from typing import Optional
import ccxt.async_support as ccxt

from app.core.config import settings
from app.db.redis import get_redis


TIMEFRAME_MAP = {
    "1m": "1m", "5m": "5m", "15m": "15m",
    "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w",
}

_exchange: Optional[ccxt.Exchange] = None


def get_exchange() -> ccxt.Exchange:
    global _exchange
    if _exchange is None:
        ExchangeClass = getattr(ccxt, settings.EXCHANGE)
        _exchange = ExchangeClass({
            "apiKey": settings.API_KEY,
            "secret": settings.API_SECRET,
            "enableRateLimit": True,
            "options": {"defaultType": "future"} if settings.EXCHANGE == "binance" else {},
        })
    return _exchange


async def get_ticker(symbol: str) -> dict:
    r = get_redis()
    cache_key = f"ticker:{symbol}"
    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    exchange = get_exchange()
    raw = await exchange.fetch_ticker(symbol)

    result = {
        "symbol": symbol.replace("/", ""),
        "name": symbol.split("/")[0],
        "price": raw["last"] or 0,
        "change": raw["change"] or 0,
        "changePercent": raw["percentage"] or 0,
        "volume": raw["quoteVolume"] or 0,
        "high24h": raw["high"] or 0,
        "low24h": raw["low"] or 0,
        "bid": raw.get("bid") or 0,
        "ask": raw.get("ask") or 0,
    }

    await r.setex(cache_key, 2, json.dumps(result))
    return result


async def get_ohlcv(symbol: str, timeframe: str = "15m", limit: int = 500) -> list[dict]:
    tf = TIMEFRAME_MAP.get(timeframe, "15m")
    r = get_redis()
    cache_key = f"ohlcv:{symbol}:{tf}:{limit}"
    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    exchange = get_exchange()
    raw = await exchange.fetch_ohlcv(symbol, tf, limit=limit)

    data = [
        {
            "time": int(row[0] / 1000),
            "open": row[1], "high": row[2], "low": row[3],
            "close": row[4], "volume": row[5],
        }
        for row in raw
    ]

    ttl = 30 if tf in ("1m", "5m") else 60
    await r.setex(cache_key, ttl, json.dumps(data))
    return data


async def get_order_book(symbol: str, depth: int = 20) -> dict:
    r = get_redis()
    cache_key = f"orderbook:{symbol}:{depth}"
    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    exchange = get_exchange()
    raw = await exchange.fetch_order_book(symbol, limit=depth)

    def process(entries: list) -> list[dict]:
        result = []
        running_total = 0.0
        for price, qty in entries[:depth]:
            running_total += qty
            result.append({"price": price, "quantity": qty, "total": round(running_total, 4)})
        return result

    bids = process(raw["bids"])
    asks = process(raw["asks"])

    spread = asks[0]["price"] - bids[0]["price"] if bids and asks else 0
    spread_pct = (spread / bids[0]["price"] * 100) if bids and spread else 0

    result = {
        "symbol": symbol.replace("/", ""),
        "bids": bids,
        "asks": asks,
        "spread": round(spread, 4),
        "spreadPercent": round(spread_pct, 4),
        "timestamp": datetime.utcnow().isoformat(),
    }

    await r.setex(cache_key, 1, json.dumps(result))
    return result


async def get_top_symbols() -> list[str]:
    return [
        "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
        "ADA/USDT", "DOT/USDT", "AVAX/USDT", "MATIC/USDT", "LINK/USDT",
        "LTC/USDT", "DOGE/USDT", "ATOM/USDT", "UNI/USDT", "APT/USDT",
    ]
