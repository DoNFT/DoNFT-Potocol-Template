from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from common.api.router import router as api_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
)

app.include_router(api_router)
