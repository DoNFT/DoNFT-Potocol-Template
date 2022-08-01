from fastapi import APIRouter, File, UploadFile
from starlette.responses import Response

from .service import ipfs_service

router = APIRouter(prefix="/ipfs")


@router.post("/get_address")
async def get_address(payload: UploadFile = File(...)) -> str:
    """
    Get ipfs address of file
    Returns: ipfs Hash
    """
    hash = await ipfs_service.add(payload.file.read(), only_hash=True)
    return f"ipfs://{hash}"


@router.post("/upload")
async def upload(payload: UploadFile = File(...)) -> str:
    """
    Uploads file to ipfs
    Returns: ipfs Hash
    """
    hash = await ipfs_service.add(payload.file.read())
    return f"ipfs://{hash}"


@router.get("/cat")
async def cat(ipfs_addr: str):
    """
    Cats the given ipfs addr
    Args:
        ipfs_addr: given ipfs hash

    Returns:
        file content
    """
    cid = ipfs_service.extract_cid(ipfs_addr)
    if cid is None:
        cid = ipfs_addr
        # raise ValueError(f'Cannot extract cid from {ipfs_addr}')
    payload = await ipfs_service.cat(cid)
    return Response(content=payload, media_type="application/octet-stream")
