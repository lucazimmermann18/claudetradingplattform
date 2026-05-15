import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import Order, OrderSide, OrderType, OrderStatus, Trade, Position

router = APIRouter(prefix="/api/orders", tags=["orders"])

DEMO_USER_ID = "demo-user-001"
FEE_RATE = 0.001  # 0.1% maker/taker fee


class PlaceOrderRequest(BaseModel):
    symbol: str
    side: str
    type: str
    quantity: float
    price: Optional[float] = None
    stopPrice: Optional[float] = None


@router.post("")
async def place_order(req: PlaceOrderRequest, db: AsyncSession = Depends(get_db)):
    from app.services.market_service import get_ticker

    # Get current market price for MARKET orders
    sym = req.symbol
    if "/" not in sym:
        sym_ccxt = sym[:-4] + "/" + sym[-4:] if sym.endswith("USDT") else sym
    else:
        sym_ccxt = sym

    try:
        ticker = await get_ticker(sym_ccxt)
        market_price = ticker["price"]
    except Exception:
        raise HTTPException(400, "Could not fetch current price")

    fill_price = market_price if req.type == "MARKET" else (req.price or market_price)
    total = fill_price * req.quantity
    fee = total * FEE_RATE

    # Create order
    order = Order(
        id=str(uuid.uuid4()),
        user_id=DEMO_USER_ID,
        symbol=req.symbol.replace("/", ""),
        side=OrderSide(req.side),
        type=OrderType(req.type),
        quantity=req.quantity,
        price=req.price,
        stop_price=req.stopPrice,
        status=OrderStatus.FILLED if req.type == "MARKET" else OrderStatus.PENDING,
        filled_qty=req.quantity if req.type == "MARKET" else 0,
        filled_price=fill_price if req.type == "MARKET" else None,
        fee=fee if req.type == "MARKET" else 0,
    )
    db.add(order)

    # For MARKET orders, immediately create a trade and update position
    if req.type == "MARKET":
        trade = Trade(
            id=str(uuid.uuid4()),
            user_id=DEMO_USER_ID,
            symbol=req.symbol.replace("/", ""),
            side=OrderSide(req.side),
            quantity=req.quantity,
            price=fill_price,
            fee=fee,
            total=total,
            order_id=order.id,
        )
        db.add(trade)

        # Update or create position
        result = await db.execute(
            select(Position).where(
                Position.user_id == DEMO_USER_ID,
                Position.symbol == req.symbol.replace("/", ""),
            )
        )
        position = result.scalar_one_or_none()

        if req.side == "BUY":
            if position:
                new_qty = position.quantity + req.quantity
                position.avg_price = (position.avg_price * position.quantity + fill_price * req.quantity) / new_qty
                position.quantity = new_qty
            else:
                position = Position(
                    id=str(uuid.uuid4()),
                    user_id=DEMO_USER_ID,
                    symbol=req.symbol.replace("/", ""),
                    quantity=req.quantity,
                    avg_price=fill_price,
                    side="LONG",
                )
                db.add(position)
        elif req.side == "SELL" and position:
            if position.quantity <= req.quantity:
                await db.delete(position)
            else:
                position.quantity -= req.quantity

    await db.commit()

    return {
        "id": order.id,
        "symbol": order.symbol,
        "side": order.side,
        "type": order.type,
        "quantity": order.quantity,
        "fillPrice": fill_price,
        "total": total,
        "fee": fee,
        "status": order.status,
        "createdAt": datetime.utcnow().isoformat(),
    }


@router.get("")
async def list_orders(status: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(Order).where(Order.user_id == DEMO_USER_ID).order_by(Order.created_at.desc()).limit(100)
    if status:
        q = q.where(Order.status == OrderStatus(status))

    result = await db.execute(q)
    orders = result.scalars().all()

    return {
        "orders": [
            {
                "id": o.id,
                "symbol": o.symbol,
                "side": o.side,
                "type": o.type,
                "quantity": o.quantity,
                "price": o.price,
                "status": o.status,
                "filledQty": o.filled_qty,
                "filledPrice": o.filled_price,
                "createdAt": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ]
    }


@router.delete("/{order_id}")
async def cancel_order(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == DEMO_USER_ID)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(400, "Only pending orders can be cancelled")

    order.status = OrderStatus.CANCELLED
    await db.commit()
    return {"message": "Order cancelled", "id": order_id}
