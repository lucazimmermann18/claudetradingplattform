"""Admin router — AI provider config management."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.database import get_db
from app.models.models import AIProviderConfig
from app.services.ai_providers import PROVIDER_MODELS, DEFAULT_MODELS, test_provider

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ProviderConfigRequest(BaseModel):
    provider: str   # "claude" | "openai" | "deepseek"
    api_key: str
    model: Optional[str] = None
    is_active: bool = False


class TestProviderRequest(BaseModel):
    provider: str
    api_key: str
    model: Optional[str] = None


@router.get("/ai-config")
async def get_ai_configs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AIProviderConfig))
    configs = result.scalars().all()
    return {
        "configs": [
            {
                "provider": c.provider,
                "model": c.model,
                "is_active": c.is_active,
                "has_key": bool(c.api_key),
                # Mask key: show only last 4 chars
                "key_preview": f"***{c.api_key[-4:]}" if c.api_key else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in configs
        ],
        "available_models": PROVIDER_MODELS,
    }


@router.post("/ai-config")
async def save_ai_config(req: ProviderConfigRequest, db: AsyncSession = Depends(get_db)):
    if req.provider not in PROVIDER_MODELS:
        raise HTTPException(400, f"Unknown provider: {req.provider}")

    model = req.model or DEFAULT_MODELS[req.provider]

    # If activating this provider, deactivate all others first
    if req.is_active:
        await db.execute(
            update(AIProviderConfig).values(is_active=False)
        )

    # Upsert
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.provider == req.provider)
    )
    cfg = result.scalar_one_or_none()

    if cfg:
        cfg.api_key = req.api_key
        cfg.model = model
        cfg.is_active = req.is_active
    else:
        cfg = AIProviderConfig(
            id=str(uuid.uuid4()),
            provider=req.provider,
            api_key=req.api_key,
            model=model,
            is_active=req.is_active,
        )
        db.add(cfg)

    await db.commit()
    return {"success": True, "provider": req.provider, "model": model, "is_active": req.is_active}


@router.post("/ai-config/test")
async def test_ai_config(req: TestProviderRequest):
    if req.provider not in PROVIDER_MODELS:
        raise HTTPException(400, f"Unknown provider: {req.provider}")
    model = req.model or DEFAULT_MODELS[req.provider]
    success = await test_provider(req.provider, req.api_key, model)
    return {"success": success, "provider": req.provider, "model": model}


@router.post("/ai-config/{provider}/activate")
async def activate_provider(provider: str, db: AsyncSession = Depends(get_db)):
    # Deactivate all, then activate this one
    await db.execute(update(AIProviderConfig).values(is_active=False))
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.provider == provider)
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(404, "Provider not configured")
    cfg.is_active = True
    await db.commit()
    return {"success": True, "active_provider": provider}


@router.delete("/ai-config/{provider}")
async def delete_ai_config(provider: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.provider == provider)
    )
    cfg = result.scalar_one_or_none()
    if cfg:
        await db.delete(cfg)
        await db.commit()
    return {"success": True}


@router.get("/ai-config/active")
async def get_active_provider(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.is_active == True)
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        return {"active": False, "provider": None, "model": None}
    return {
        "active": True,
        "provider": cfg.provider,
        "model": cfg.model,
        "key_preview": f"***{cfg.api_key[-4:]}" if cfg.api_key else None,
    }
