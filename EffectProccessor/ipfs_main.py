import uvicorn

from base_service import ipfs_app
from settings import HOST
from settings import PORT

if __name__ == "__main__":
    uvicorn.run(ipfs_app, host=HOST, port=PORT)
