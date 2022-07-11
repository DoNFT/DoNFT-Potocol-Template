import asyncio
import logging
from io import BytesIO

from fastapi import HTTPException
from fastapi import responses

from common.api.effects.utils import GenerationImageError
from common.api.effects.utils import ResponseError
from common.api.effects.utils import fetch_content
from common.api.ipfs.service import IPFSServiceException
from common.api.ipfs.service import ipfs_service
from common.eth.service import get_service_cls
from common.instance_service_attributes import service
from settings import ETH_NODE

web3_service = get_service_cls()(ETH_NODE)


def check_token(contract, token_id, sender):
    logging.info(f"[Info]Checking ownerships of original {contract}:{token_id} to sender {sender}")
    if not web3_service.has_token_ownership(
            contract, token_id, sender,
    ):
        raise HTTPException(
            status_code=403, detail="original does not belong to sender"
        )


async def generate_content(contents):
    logging.info("[Info] Generating content")
    try:
        transformed = await service.transform(contents)
    except Exception:
        raise GenerationImageError("[Error] Failed to generate image")
    return transformed


async def fetch_contents(content_urls):
    logging.info("[Info] Fetching content")
    image_contents = await asyncio.gather(
        *[fetch_content(content_url) for content_url in content_urls],
    )
    return image_contents


async def upload_content(content):
    logging.info("[Info] Uploading content")
    try:
        ipfs_url = await ipfs_service.add(content)
    except Exception:
        raise IPFSServiceException("[Error] IPFS service error")
    return ipfs_url


def response_content(content, ipfs_url=''):
    logging.info("[Info] Responding")
    try:
        response_stream = BytesIO(content)
        res = responses.StreamingResponse(
            response_stream,
            media_type="image/jpeg",
            headers={"ContentUrl": f"ipfs://{ipfs_url}", "Access-Control-Expose-Headers": "ContentUrl"}
        )
    except Exception:
        raise ResponseError('[Error] Failed to send result')
    return res
