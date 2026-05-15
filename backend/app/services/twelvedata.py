"""
Twelve Data market data client.
REST: historical OHLCV + full quotes
WebSocket: real-time price streaming (wss://ws.twelvedata.com/v1/quotes/price)
"""
import json
import logging
import time
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

TWELVEDATA_BASE = "https://api.twelvedata.com"
TWELVEDATA_WS_URL = "wss://ws.twelvedata.com/v1/quotes/price"

# Twelve Data interval names
TIMEFRAME_MAP: dict[str, str] = {
    "1m":  "1min",
    "5m":  "5min",
    "15m": "15min",
    "1h":  "1h",
    "4h":  "4h",
    "1d":  "1day",
    "1w":  "1week",
}

# Crypto symbols this platform tracks (Twelve Data format: BASE/USD)
CRYPTO_SYMBOLS_TD = [
    "BTC/USD", "ETH/USD", "SOL/USD", "BNB/USD", "XRP/USD",
    "ADA/USD", "DOT/USD", "AVAX/USD", "MATIC/USD", "LINK/USD",
    "LTC/USD", "DOGE/USD",
]


def to_td_symbol(symbol: str) -> str:
    """BTCUSDT or BTC/USDT → BTC/USD (Twelve Data format)."""
    if "/" not in symbol:
        # "BTCUSDT" style
        if symbol.endswith("USDT"):
            return f"{symbol[:-4]}/USD"
        if symbol.endswith("USD"):
            return f"{symbol[:-3]}/USD"
        return symbol
    # "BTC/USDT" or "BTC/USD" style
    base, _ = symbol.split("/", 1)
    return f"{base}/USD"


def from_td_symbol(td_symbol: str) -> str:
    """BTC/USD → BTCUSDT (internal format)."""
    base = td_symbol.split("/")[0]
    return f"{base}USDT"


class TwelveDataClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._http = httpx.AsyncClient(timeout=12.0)

    def _params(self, **kwargs) -> dict:
        return {"apikey": self.api_key, **kwargs}

    async def get_quote(self, symbol: str) -> Optional[dict]:
        """Full quote (price + 24h high/low/volume/change)."""
        td_sym = to_td_symbol(symbol)
        try:
            r = await self._http.get(
                f"{TWELVEDATA_BASE}/quote",
                params=self._params(symbol=td_sym),
            )
            d = r.json()
            if d.get("status") == "error":
                logger.warning(f"[TD] quote error {td_sym}: {d.get('message')}")
                return None

            price    = float(d.get("close") or d.get("price") or 0)
            change   = float(d.get("change") or 0)
            change_p = float(d.get("percent_change") or 0)
            high     = float(d.get("high") or price)
            low      = float(d.get("low") or price)
            volume   = float(d.get("volume") or 0)

            return {
                "symbol":        from_td_symbol(td_sym),
                "name":          d.get("name", td_sym.split("/")[0]),
                "price":         price,
                "change":        change,
                "changePercent": change_p,
                "volume":        volume,
                "high24h":       high,
                "low24h":        low,
                "bid":           round(price * 0.9999, 8),
                "ask":           round(price * 1.0001, 8),
            }
        except Exception as e:
            logger.error(f"[TD] get_quote error: {e}")
            return None

    async def get_time_series(
        self,
        symbol: str,
        interval: str = "15min",
        outputsize: int = 500,
    ) -> list[dict]:
        """OHLCV candles, sorted oldest→newest."""
        td_sym   = to_td_symbol(symbol)
        td_itvl  = TIMEFRAME_MAP.get(interval, interval)
        try:
            r = await self._http.get(
                f"{TWELVEDATA_BASE}/time_series",
                params=self._params(
                    symbol=td_sym,
                    interval=td_itvl,
                    outputsize=min(outputsize, 5000),
                ),
            )
            d = r.json()
            if d.get("status") == "error":
                logger.warning(f"[TD] time_series error: {d.get('message')}")
                return []

            values = d.get("values", [])
            result = []
            for v in reversed(values):  # TD returns newest-first; we want oldest-first
                try:
                    # datetime format: "2024-01-15 09:30:00" or "2024-01-15"
                    dt_str = v["datetime"]
                    if len(dt_str) == 10:
                        dt_str += " 00:00:00"
                    ts = int(time.mktime(time.strptime(dt_str, "%Y-%m-%d %H:%M:%S")))
                    result.append({
                        "time":   ts,
                        "open":   float(v["open"]),
                        "high":   float(v["high"]),
                        "low":    float(v["low"]),
                        "close":  float(v["close"]),
                        "volume": float(v.get("volume") or 0),
                    })
                except Exception:
                    continue
            return result
        except Exception as e:
            logger.error(f"[TD] get_time_series error: {e}")
            return []

    async def get_price(self, symbol: str) -> Optional[float]:
        """Lightweight single-price endpoint."""
        td_sym = to_td_symbol(symbol)
        try:
            r = await self._http.get(
                f"{TWELVEDATA_BASE}/price",
                params=self._params(symbol=td_sym),
            )
            d = r.json()
            if "price" in d:
                return float(d["price"])
        except Exception as e:
            logger.error(f"[TD] get_price error: {e}")
        return None

    async def close(self):
        await self._http.aclose()


_client: Optional[TwelveDataClient] = None


def get_td_client(api_key: str) -> TwelveDataClient:
    global _client
    if _client is None:
        _client = TwelveDataClient(api_key)
    return _client
