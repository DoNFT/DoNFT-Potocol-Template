from typing import List
from typing import Union

from pydantic import BaseModel


class ContentPayload(BaseModel):
    contract: str
    tokenId: str
    contentUrl: str


class ApplyEffectPayload(BaseModel):
    original: ContentPayload
    modificator: Union[List[ContentPayload], ContentPayload]
    sender: str
