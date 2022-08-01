from fastapi import APIRouter

from router import router as ipfs_router
from settings import PROJECT_VERSION

router = APIRouter(prefix="/api")

router.include_router(ipfs_router)


@router.get("/healthcheck")
async def healthcheck() -> str:
    return f"Do[NFT] Backend v.{PROJECT_VERSION}"
