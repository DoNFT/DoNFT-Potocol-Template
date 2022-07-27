from pydantic import BaseModel


class SubscribePayload(BaseModel):
    email: str
    telegram: str
