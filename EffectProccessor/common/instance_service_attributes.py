import common.service_attributes.factory_sevice_attributes as factory
from settings import SERVICE_EFFECT

factory_attributes = factory.FactoryServiceAttributes()
service_attributes = factory_attributes.create_service_attributes(SERVICE_EFFECT)
service = service_attributes.get_effect_service()
