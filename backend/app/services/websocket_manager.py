"""
WebSocket connection manager for real-time market data streaming.
"""
import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, client_id: str):
        await ws.accept()
        self.active[client_id] = ws
        logger.info(f"[WS] Client connected: {client_id} (total: {len(self.active)})")

    def disconnect(self, client_id: str):
        self.active.pop(client_id, None)
        logger.info(f"[WS] Client disconnected: {client_id} (total: {len(self.active)})")

    async def send(self, client_id: str, data: Any):
        ws = self.active.get(client_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(client_id)

    async def broadcast(self, data: Any):
        dead = []
        for client_id, ws in list(self.active.items()):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(client_id)
        for cid in dead:
            self.disconnect(cid)

    @property
    def count(self) -> int:
        return len(self.active)


manager = ConnectionManager()
