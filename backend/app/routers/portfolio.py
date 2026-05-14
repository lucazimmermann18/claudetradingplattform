import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.models.models import Position, Trade, Order

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# For now, use a demo user ID. Full auth will be added later.
DEMO_USER_ID = "demo-user-001"


@router.get("/positions")
async def get_positions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Position).where(Position.user_id == DEMO_USER_ID)
    )
    positions = result.scalars().all()

    from app.services.market_service import get_ticker

    enriched = []
    for pos in positions:
        try:
            sym = pos.symbol + "/USDT" if not pos.symbol.endswith("USDT") else pos.symbol[:-4] + "/USDT"
            ticker = await get_ticker(sym)
            current_price = ticker["price"]
        except Exception:
            current_price = pos.avg_price

        pnl = (current_price - pos.avg_price) * pos.quantity
        pnl_pct = ((current_price - pos.avg_price) / pos.avg_price * 100) if pos.avg_price else 0

        enriched.append({
            "id": pos.id,
            "symbol": pos.symbol,
            "name": pos.symbol.replace("USDT", ""),
            "quantity": pos.quantity,
            "avgPrice": pos.avg_price,
            "currentPrice": current_price,
            "pnl": round(pnl, 2),
            "pnlPercent": round(pnl_pct, 2),
            "value": round(current_price * pos.quantity, 2),
            "side": pos.side,
        })

    return {"positions": enriched}


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Demo stats - will be calculated from real trades in full implementation
    return {
        "totalValue": 125430.50,
        "totalPnl": 25430.50,
        "totalPnlPercent": 25.43,
        "dayPnl": 1247.30,
        "dayPnlPercent": 1.00,
        "cash": 45000.00,
        "invested": 80430.50,
        "winRate": 62.5,
        "totalTrades": 48,
    }


@router.get("/trades")
async def get_trades(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Trade)
        .where(Trade.user_id == DEMO_USER_ID)
        .order_by(Trade.timestamp.desc())
        .limit(limit)
    )
    trades = result.scalars().all()

    return {
        "trades": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "side": t.side,
                "quantity": t.quantity,
                "price": t.price,
                "fee": t.fee,
                "total": t.total,
                "pnl": t.pnl,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            }
            for t in trades
        ]
    }
