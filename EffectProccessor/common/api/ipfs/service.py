import json
import logging
import re
from typing import Optional
from typing import TypeVar

from aiohttp import ClientSession
from aiohttp import ClientTimeout

from settings import IPFS_API_TIMEOUT
from settings import NFT_STORAGE_API_TOKEN


class IPFSServiceException(Exception):
    pass


BASE_IPFS_SERVICE_TYPE = TypeVar("BASE_IPFS_SERVICE_TYPE", bound="BaseIPFSService")


class NTFStorageIPFSService:

    PINATA_ENDPOINT_REGEX = re.compile(r'pinata.cloud/ipfs/(?P<cid>\w+)')
    IPFS_ENDPOINT_REGEX = re.compile(r'ipfs.io/ipfs/(?P<cid>\w+)')
    _dest_formfield_name = "file"


    def __init__(self, timeout: float = 5.0):
        self.timeout = ClientTimeout(timeout)

    async def add(self, payload: bytes) -> str:
        logging.info("[Info] Uploading file to IPFS")

        headers = {"Authorization": f"Bearer {NFT_STORAGE_API_TOKEN}"}
        async with ClientSession(timeout=self.timeout, headers=headers) as session:
            async with session.request("post", "https://api.nft.storage/upload",
                                       data={self._dest_formfield_name: payload}) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise IPFSServiceException(
                        f"Request to ipfs POST:https://api.nft.storage/upload got unexpected status {resp.status}:{text}"
                    )

        resp = await resp.read()
        return f'{json.loads(resp)["value"]["cid"]}/{self._dest_formfield_name}'

    async def cat(self, ipfs_addr: str) -> bytes:
        headers = {"Authorization": f"Bearer {NFT_STORAGE_API_TOKEN}"}
        cid = ipfs_addr.replace('ipfs://', '')
        if cid.startswith('Q') or cid.startswith('b'):  # V0 CID
            url = f"https://nftstorage.link/ipfs/{cid}"
        else:
            url = f"https://{cid}.ipfs.nftstorage.link/{self._dest_formfield_name}"
        logging.info(f"[Info] Getting file from {url}")

        async with ClientSession(timeout=self.timeout, headers=headers) as session:
            async with session.request("get", url) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise IPFSServiceException(
                        f"Request to ipfs GET:{url} got unexpected status {resp.status}:{text}"
                    )

        return await resp.read()

    @classmethod
    def extract_cid(cls, endpoint: str) -> Optional[str]:
        if endpoint.startswith('ipfs://'):
            return endpoint.replace('ipfs://', '')
        if res := cls.PINATA_ENDPOINT_REGEX.search(endpoint):
            return res.group('cid')
        if res := cls.IPFS_ENDPOINT_REGEX.search(endpoint):
            return res.group('cid')
        return None


ipfs_service = NTFStorageIPFSService(IPFS_API_TIMEOUT)
