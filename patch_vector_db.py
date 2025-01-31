from pydantic import BaseModel
from enum import Enum
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List

class MAGNIFICATIONS(Enum):
    X5 = "5x"
    X10 = "10x"
    X20 = "20x"
    X40 = "40x"


class PatcbPaylad(BaseModel):
    source_dataset: str
    source_wsi_path: str
    patient_id: str
    magnification: MAGNIFICATIONS
    wsi_stain: str
    x: int
    y: int
    patch_size: int


class PatchVectorDB: 

    def __init__(self, location: str | None, collection_name: str) -> None:
        self.location = location if location else ":memory:"
        self.collection_name = collection_name
        self.client = QdrantClient(location=self.location)

    def get_collections(self) -> List[str]:
        pass

    def query_database(self, self.)
