"""
Background task: streams live ticker prices to frontend WebSocket clients.

Strategy:
- With TWELVEDATA_API_KEY → connect to Twelve Data WebSocket for real-time ticks
- Without key           → fall back to polling the ccxt exchange every 2 s
"""
import asyncio
import json
import logging
from typing import Optional

from app.core.config import settings
from app.services.twelvedata import (
    to_td_symbol, from_td_symbol, TWELVEDATA_WS_URL, CRYPTO_SYMBOLS_TD,
)
from app.services.market_service import get_ticker, WATCHLIST
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)

# Internal symbols we track
STREAM_SYMBOLS = WATCHLIST  # ["BTC/USDT", "ETH/USDT", …]

# In-memory ticker cache (last known state per symbol)
_cache: dict[str, dict] = {}


async def stream_tickers():
    if settings.TWELVEDATA_API_KEY:
        logger.info("[TickerStream] Using Twelve Data WebSocket")
        await _td_websocket_loop()
    else:
        logger.info("[TickerStream] No API key — falling back to polling")
        await _polling_loop()


# ── Twelve Data WebSocket ─────────────────────────────────────────────────────

async def _td_websocket_loop():
    """Connect to TD WebSocket, reconnect on any error."""
    td_symbols = [to_td_symbol(s) for s in STREAM_SYMBOLS]
    ws_url = f"{TWELVEDATA_WS_URL}?apikey={settings.TWELVEDATA_API_KEY}"

    while True:
        try:
            await _td_run_session(ws_url, td_symbols)
        except Exception as e:
            logger.error(f"[TickerStream] WebSocket error: {e!r} — reconnecting in 5 s")
            await asyncio.sleep(5)


async def _td_run_session(ws_url: str, td_symbols: list[str]):
    import websockets  # lazy import — only needed when using TD

    async with websockets.connect(
        ws_url,
        ping_interval=20,
        ping_timeout=30,
        open_timeout=15,
    ) as ws:
        await ws.send(json.dumps({
            "action": "subscribe",
            "params": {"symbols": ",".join(td_symbols)},
        }))
        logger.info(f"[TickerStream] Subscribed to {len(td_symbols)} TD symbols")

        async for raw in ws:
            try:
                msg = json.loads(raw)
            except Exception:
                continue

            event = msg.get("event")

            if event == "price":
                await _handle_td_price(msg)
            elif event == "subscribe-status":
                status = msg.get("status", "unknown")
                logger.info(f"[TickerStream] TD subscribe-status: {status} — {msg.get('message', '')}")
            elif event == "heartbeat":
                pass  # normal keep-alive; ignore
            elif event == "error":
                logger.warning(f"[TickerStream] TD error event: {msg}")


async def _handle_td_price(msg: dict):
    td_sym = msg.get("symbol", "")
    if not td_sym:
        return

    price = _float(msg.get("price"))
    if not price:
        return

    internal_sym = from_td_symbol(td_sym)  # BTC/USD → BTCUSDT

    prev = _cache.get(internal_sym)
    if prev:
        prev_price = prev["price"]
        open_p     = prev.get("open24h", price)
        change     = price - open_p
        change_pct = (change / open_p * 100) if open_p else 0
        ticker = {
            **prev,
            "price":         price,
            "change":        round(change, 8),
            "changePercent": round(change_pct, 4),
            "bid":           round(price * 0.9999, 8),
            "ask":           round(price * 1.0001, 8),
            "high24h":       max(prev.get("high24h", price), price),
            "low24h":        min(prev.get("low24h", price), price),
        }
        if "day_volume" in msg:
            ticker["volume"] = _float(msg["day_volume"]) or prev.get("volume", 0)
    else:
        # First tick for this symbol — seed from cache / Twelve Data quote
        ticker = {
            "symbol":        internal_sym,
            "name":          td_sym.split("/")[0],
            "price":         price,
            "change":        0.0,
            "changePercent": 0.0,
            "volume":        _float(msg.get("day_volume")) or 0,
            "high24h":       price,
            "low24h":        price,
            "bid":           round(price * 0.9999, 8),
            "ask":           round(price * 1.0001, 8),
            "open24h":       price,
        }

    _cache[internal_sym] = ticker

    if manager.count > 0:
        await manager.broadcast({"type": "ticker", "data": ticker})


# ── REST polling fallback ────────────────────────────────────────────────────

async def _polling_loop():
    while True:
        if manager.count == 0:
            await asyncio.sleep(2)
            continue

        tasks = [get_ticker(sym) for sym in STREAM_SYMBOLS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                continue
            try:
                _cache[result["symbol"]] = result
                await manager.broadcast({"type": "ticker", "data": result})
            except Exception as e:
                logger.debug(f"[TickerStream] broadcast error: {e}")

        await asyncio.sleep(2)


# ── helpers ──────────────────────────────────────────────────────────────────

def _float(v) -> Optional[float]:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
