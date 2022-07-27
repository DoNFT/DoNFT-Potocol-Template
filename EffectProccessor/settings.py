from enum import Enum
from pathlib import Path

import environs


class Environment(Enum):
    DEV = "DEV"
    STAGE = "STAGE"
    PROD = "PROD"


class ServiceEffect(Enum):
    STYLE_TRANSFER = "STYLE_TRANSFER"


PROJECT_DIR = Path(__file__).parent.parent.resolve()
BACKEND_DIR = PROJECT_DIR / "backend"

env = environs.Env()
env.read_env(BACKEND_DIR / ".env", recurse=False)

ENVIRONMENT = env.enum("ENVIRONMENT", type=Environment, ignore_case=True)
SERVICE_EFFECT = env.enum(
    "SERVICE_EFFECT",
    type=ServiceEffect,
    ignore_case=True,
    default=ServiceEffect.STYLE_TRANSFER.value,
)

with open(BACKEND_DIR / "version.txt", "r") as f:
    PROJECT_VERSION = f.read().replace('/n', '')

HOST = env.str("HOST", "127.0.0.1")
PORT = env.int("PORT", 8000)
GRAPH_URL = env.str("GRAPH_URL")
WORKERS_NUM = env.int("WORKERS_NUM", 1)

PUBLIC_HOST = env.str("PUBLIC_HOST", "localhost")
IPFS_API_TIMEOUT = env.float("IPFS_API_TIMEOUT", default=30.0)
NFT_STORAGE_API_TOKEN = env("NFT_STORAGE_API_TOKEN", default=None)
ETH_NODE = env.str("ETH_NODE")
CFG_PATH = env.str("CFG_PATH")
