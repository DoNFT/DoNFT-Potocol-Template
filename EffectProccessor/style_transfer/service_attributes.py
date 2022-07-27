import os
from pathlib import Path
from typing import Dict

import tensorflow_hub as hub
from fastapi import APIRouter

from common.api.effects.base_effect_service import BaseEffectService
from common.api.effects.utils import fetch_content
from common.service_attributes.base_service_attributes import BaseServiceAttributes
from style_transfer.style_transfer_effect_service import StyleTransferEffectService

MODELS = Path('./tmp/')
SAVED_MODEL_GAN = MODELS / 'gan'
VARIABLES_PATH = SAVED_MODEL_GAN / 'variables'


class StyleTransferServiceAttributes(BaseServiceAttributes):
    def get_effect_service(self) -> BaseEffectService:
        attributes = self._get_attributes()
        hub_model = attributes['hub_model']
        return StyleTransferEffectService(hub_model)

    def _get_attributes(self) -> Dict:
        return {
            'hub_model': hub.load(str(SAVED_MODEL_GAN))
        }

    def get_effects_router(self) -> APIRouter:
        from style_transfer.router import router
        return router

    async def save_attributes(self):
        if not os.path.isdir(SAVED_MODEL_GAN):
            os.makedirs(SAVED_MODEL_GAN)
        if not os.path.isdir(VARIABLES_PATH):
            os.mkdir(VARIABLES_PATH)
        cid_saved_model = self.cfg['CID_SAVED_MODEL']
        cid_var_data_0 = self.cfg['CID_VARIABLES_DATA_00000_OF_00002']
        cid_var_data_1 = self.cfg['CID_VARIABLES_DATA_00001_OF_00002']
        cid_var_index = self.cfg['CID_VARIABLES_INDEX']

        saved_model = await fetch_content(f'ipfs://{cid_saved_model}')
        with open(SAVED_MODEL_GAN / 'saved_model.pb', 'wb') as f:
            f.write(saved_model)
        variables_data_00000_of_00002 = await fetch_content(f'ipfs://{cid_var_data_0}')
        with open(VARIABLES_PATH / 'variables.data-00000-of-00002', 'wb') as f:
            f.write(variables_data_00000_of_00002)
        variables_data_00001_of_00002 = await fetch_content(f'ipfs://{cid_var_data_1}')
        with open(VARIABLES_PATH / 'variables.data-00001-of-00002', 'wb') as f:
            f.write(variables_data_00001_of_00002)
        variables_index = await fetch_content(f'ipfs://{cid_var_index}')
        with open(VARIABLES_PATH / 'variables.index', 'wb') as f:
            f.write(variables_index)
