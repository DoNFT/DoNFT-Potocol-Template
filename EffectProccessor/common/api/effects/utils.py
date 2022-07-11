import logging

import requests
from aiohttp import ClientSession
from aiohttp import ClientTimeout

from common.api.service import ipfs_service


async def fetch_content(content_url: str, timeout: float = 20) -> bytes:
    logging.info(f"[Info] Fetching {content_url}")
    try:
        extracted_cid = ipfs_service.extract_cid(content_url)
        if extracted_cid is not None:
            logging.info(f"[Info] Getting cid {extracted_cid}")
            file = ''
            if content_url[-5:] == '/file':
                file = '/file'
            return await ipfs_service.cat(extracted_cid + file)
        elif 'ipfs' in content_url:
            logging.info("[Info] by http client")
            async with ClientSession(timeout=ClientTimeout(timeout)) as session:
                resp = await session.get(content_url)
                return await resp.read()
        else:
            return requests.get(content_url).content

    except Exception:
        raise LoadContentError("[Error] Didn't load file from " + content_url)


class LoadContentError(Exception):
    pass


class GenerationImageError(Exception):
    pass


class ResponseError(Exception):
    pass
