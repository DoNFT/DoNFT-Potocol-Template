from typing import List

from fastapi import APIRouter

from common.api.effects.data_types import ApplyEffectPayload
from common.api.effects.data_types import Effect
from common.api.effects.base_effect_router import check_token
from common.api.effects.base_effect_router import fetch_contents
from common.api.effects.base_effect_router import generate_content
from common.api.effects.base_effect_router import response_content
from common.api.effects.base_effect_router import upload_content
from common.instance_service_attributes import service

router = APIRouter(prefix="/effects")


@router.post("/applyEffect")
async def apply_effect(effect_payload: ApplyEffectPayload):
    check_token(
        effect_payload.original.contract,
        effect_payload.original.tokenId,
        effect_payload.sender
    )
    check_token(
        effect_payload.modificator.contract,
        effect_payload.modificator.tokenId,
        effect_payload.sender,
    )

    image_content, modificator_content = await fetch_contents(
        [effect_payload.original.contentUrl, effect_payload.modificator.contentUrl]
    )

    transformed = await generate_content([image_content, modificator_content])
    
    ipfs_url = await upload_content(transformed)

    res = response_content(transformed, ipfs_url)

    return res
