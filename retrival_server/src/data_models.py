from enum import Enum
from pydantic import BaseModel
from typing import List
import math

class DATASETS(Enum):
    CMUH = "CMUH"
    KPMP = "KPMP"
    TCGA = "TCGA"
    DFCI = "DFCI"


class STAINS(Enum):
    HE = "H&E"
    PAS = "PAS"
    TRI = "TRI"
    SIL = "SIL"
    OTHER = "OTHER"
    

class MAGNIFICATIONS(Enum):
    X5 = "5x"
    X10 = "10x"
    X20 = "20x"
    X40 = "40x"


class TILE_TAGS(Enum):
    BLUR = "BLUR"
    CANCER = "CANCER"


class TilePayload(BaseModel):
    uuid: str
    patient_id: str
    wsi_path: str
    dataset: DATASETS
    magnification: MAGNIFICATIONS
    stain: STAINS
    x: int
    y: int
    size: int
    score: float | None = None
    tags: List[str] = []


class WSI_ENTRY(BaseModel):
    wsi_path: str
    note: str | None = None
    labels: List[str] = []

    def __init__(self, **data):
        # TODO: REMOVE THE NEED FOR THIS!!!!
        # Convert 'nan' to None for the note field
        if "note" in data and isinstance(data["note"], float) and math.isnan(data["note"]):
            data["note"] = None
        super().__init__(**data)