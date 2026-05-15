from fastapi import APIRouter, HTTPException, Query
from app.services.market_service import get_ticker, get_ohlcv, get_order_book, get_top_symbols

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/ticker/{symbol}")
async def ticker(symbol: str):
    try:
        # Normalize: BTCUSDT -> BTC/USDT
        if "/" not in symbol:
            sym = symbol[:-4] + "/" + symbol[-4:] if symbol.endswith("USDT") else symbol
        else:
            sym = symbol
        data = await get_ticker(sym)
        return data
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/ohlcv/{symbol}")
async def ohlcv(
    symbol: str,
    timeframe: str = Query("15m"),
    limit: int = Query(500, le=1000),
):
    try:
        if "/" not in symbol:
            sym = symbol[:-4] + "/" + symbol[-4:] if symbol.endswith("USDT") else symbol
        else:
            sym = symbol
        data = await get_ohlcv(sym, timeframe, limit)
        return {"symbol": symbol, "timeframe": timeframe, "data": data}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/orderbook/{symbol}")
async def orderbook(symbol: str, depth: int = Query(20, le=50)):
    try:
        if "/" not in symbol:
            sym = symbol[:-4] + "/" + symbol[-4:] if symbol.endswith("USDT") else symbol
        else:
            sym = symbol
        return await get_order_book(sym, depth)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/top")
async def top():
    return {"symbols": await get_top_symbols()}


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    top = await get_top_symbols()
    filtered = [s for s in top if q.upper() in s.upper()]
    return {"results": filtered}
