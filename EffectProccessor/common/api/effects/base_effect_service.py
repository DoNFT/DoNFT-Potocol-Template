import asyncio
import multiprocessing as mp
from abc import ABC
from concurrent.futures import ProcessPoolExecutor
from typing import Dict
from typing import List
from typing import Optional

from settings import WORKERS_NUM

_EXECUTOR = ProcessPoolExecutor(
    max_workers=WORKERS_NUM, mp_context=mp.get_context("spawn")
)


class BaseEffectService(ABC):
    async def transform(self, contents: List, params: Optional[Dict] = None):
        loop = asyncio.get_event_loop()
        if self._support_async:
            result = await loop.run_in_executor(
                _EXECUTOR,
                self._perform_transformation,
                contents,
                params,
            )
        else:
            result = self._perform_transformation(contents, params)
        return result

    @property
    def _support_async(self) -> bool:
        return False

    def _perform_transformation(
        self, contents, params: Optional[Dict] = None,
    ):
        raise NotImplementedError
