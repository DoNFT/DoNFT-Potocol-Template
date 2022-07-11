import importlib

from common.service_attributes.base_service_attributes import BaseServiceAttributes
from settings import CFG_PATH
from settings import ServiceEffect


class FactoryServiceAttributes:
    def __init__(self):
        self.service_effect_to_pkg = {
            ServiceEffect.STYLE_TRANSFER: 'style_transfer.service_attributes',
        }
        self.service_effect_to_service_attributes = {
            ServiceEffect.STYLE_TRANSFER: 'StyleTransferServiceAttributes',
        }

    def create_service_attributes(self, service_effect) -> BaseServiceAttributes:
        pkg = importlib.import_module(self.service_effect_to_pkg[service_effect])
        service_attributes = self.service_effect_to_service_attributes[service_effect]
        instance = getattr(pkg, service_attributes)(CFG_PATH)
        return instance
