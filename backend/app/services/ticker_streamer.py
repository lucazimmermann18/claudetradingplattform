"""
Background task: streams live ticker prices from exchange via ccxt
and broadcasts to all connected WebSocket clients.
"""
import asyncio
import logging

from app.services.market_service import get_ticker, WATCHLIST
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)

STREAM_SYMBOLS = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
    "ADA/USDT", "DOT/USDT", "AVAX/USDT", "MATIC/USDT", "LINK/USDT",
    "LTC/USDT", "DOGE/USDT",
]


async def stream_tickers():
    """Poll tickers every 2 seconds and push to all connected clients."""
    logger.info("[TickerStream] Starting...")
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
                await manager.broadcast({"type": "ticker", "data": result})
            except Exception as e:
                logger.debug(f"[TickerStream] broadcast error: {e}")

        await asyncio.sleep(2)
