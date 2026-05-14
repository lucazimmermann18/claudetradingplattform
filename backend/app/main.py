import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import create_tables
from app.routers import market, signals, portfolio, orders, websocket
from app.services.websocket_manager import manager
from app.services.ticker_streamer import stream_tickers
from app.services.signal_engine import run_signal_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

background_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TradeAI Pro starting up...")
    await create_tables()

    # Start background tasks
    background_tasks.append(asyncio.create_task(stream_tickers()))
    background_tasks.append(asyncio.create_task(run_signal_engine(manager)))

    logger.info("Background tasks started")
    yield

    logger.info("Shutting down...")
    for task in background_tasks:
        task.cancel()
    await asyncio.gather(*background_tasks, return_exceptions=True)


app = FastAPI(
    title="TradeAI Pro API",
    description="Institutional Signal Engine — Real-time trading platform backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router)
app.include_router(signals.router)
app.include_router(portfolio.router)
app.include_router(orders.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ws_clients": manager.count,
        "exchange": settings.EXCHANGE,
    }
