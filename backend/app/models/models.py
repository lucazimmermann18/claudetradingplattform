from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base


class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    PARTIAL = "PARTIAL"


class SignalType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    NEUTRAL = "NEUTRAL"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user")
    positions = relationship("Position", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False, index=True)
    side = Column(Enum(OrderSide), nullable=False)
    type = Column(Enum(OrderType), nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=True)
    stop_price = Column(Float, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    filled_qty = Column(Float, default=0.0)
    filled_price = Column(Float, nullable=True)
    fee = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="orders")


class Position(Base):
    __tablename__ = "positions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    avg_price = Column(Float, nullable=False)
    side = Column(String, default="LONG")
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="positions")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    side = Column(Enum(OrderSide), nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    pnl = Column(Float, nullable=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True)
    symbol = Column(String, nullable=False, index=True)
    type = Column(Enum(SignalType), nullable=False)
    confidence = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    indicators_json = Column(Text, nullable=True)
    timeframe = Column(String, default="15m")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
