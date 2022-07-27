import asyncio
import json
from abc import ABC
from abc import abstractmethod
from typing import Dict
from typing import Optional

from fastapi import APIRouter

from common.api.effects.base_effect_service import BaseEffectService


class BaseServiceAttributes(ABC):

    def __init__(self, cfg_path: Optional[str] = None):
        asyncio.run(self.save_attributes())
        self.cfg = None
        if cfg_path:
            with open(cfg_path) as f:
                self.cfg = json.load(f)

    @abstractmethod
    def get_effect_service(self) -> BaseEffectService:
        pass

    @abstractmethod
    def _get_attributes(self) -> Dict:
        pass

    @abstractmethod
    def get_effects_router(self) -> APIRouter:
        pass

    @abstractmethod
    async def save_attributes(self):
        pass
