import redis.asyncio as redis
from app.core.config import settings

_pool: redis.ConnectionPool | None = None


def get_pool() -> redis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
    return _pool


def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=get_pool())
