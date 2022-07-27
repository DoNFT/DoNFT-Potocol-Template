import common.instance_service_attributes as instance_service_attributes
from fastapi import APIRouter
from settings import PROJECT_VERSION

router = APIRouter(prefix="/api")

effects_router = instance_service_attributes.service_attributes.get_effects_router()
router.include_router(effects_router)


@router.get("/healthcheck")
async def healthcheck() -> str:
    return f"Do[NFT] Backend v.{PROJECT_VERSION}"
