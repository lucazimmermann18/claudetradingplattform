import json
from fastapi import APIRouter, Query, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.db.redis import get_redis
from app.services.signal_engine import analyze, WATCHLIST
from app.services.market_service import get_ohlcv

router = APIRouter(prefix="/api/signals", tags=["signals"])

SYMBOL_LIST = [s.replace("/", "") for s in WATCHLIST]


class AnalyzeRequest(BaseModel):
    symbol: str
    timeframe: str = "15m"


@router.get("")
async def list_signals(symbol: str = Query(None)):
    r = get_redis()
    signals = []

    symbols_to_check = [symbol] if symbol else SYMBOL_LIST

    for sym in symbols_to_check:
        # Normalize
        lookup = sym if sym.endswith("USDT") else sym + "USDT"
        ccxt_sym = lookup[:-4] + "/" + lookup[-4:]
        raw = await r.get(f"signal:{ccxt_sym}")
        if raw:
            signals.append(json.loads(raw))

    signals.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
    return {"signals": signals, "count": len(signals)}


@router.post("/analyze")
async def analyze_symbol(req: AnalyzeRequest):
    try:
        sym = req.symbol
        if "/" not in sym:
            sym = sym[:-4] + "/" + sym[-4:] if sym.endswith("USDT") else sym

        ohlcv = await get_ohlcv(sym, req.timeframe, 300)
        signal = analyze(sym, ohlcv, req.timeframe)

        if not signal:
            return {"signal": None, "message": "Insufficient data for analysis"}

        # Cache it
        r = get_redis()
        await r.setex(f"signal:{sym}", 300, json.dumps(signal))

        return {"signal": signal}
    except Exception as e:
        raise HTTPException(500, str(e))
