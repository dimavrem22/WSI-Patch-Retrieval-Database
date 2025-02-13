import sys
from pathlib import Path
from typing import List, Tuple
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, PointStruct, Filter, FieldCondition, MatchValue, CollectionDescription, CollectionsResponse

# Set the root directory dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent  # Adjust as needed
sys.path.insert(0, str(ROOT_DIR))

# Now import TilePayload
from src.data_models import TilePayload

class TileVectorDB:
    def __init__(self, qdrant_address: str, collection_name: str) -> None:
        self.qdrant_address = qdrant_address
        self.collection_name = collection_name
        
        # Establish client
        try:
            self.qdrant_client = QdrantClient(location=self.qdrant_address)
        except Exception as e:
            raise Exception(f"Failed to initialize Qdrant client at {self.qdrant_address}: {e}")

        # Verify connection
        if not self._is_client_alive():
            raise Exception(f"Qdrant client at {self.qdrant_address} is unreachable!")
        
        # Verify valid collection
        available_collections = [
            collection.name for collection in self.qdrant_client.get_collections().collections
        ]
        print(f"Avaiable collections: {available_collections}")
        if self.collection_name not in available_collections:
            raise Exception(f"Qdrant collection {self.collection_name} does not exist!")

        print(f"QdrantClient at {self.qdrant_address} successfully initialized!")

    def _is_client_alive(self) -> bool:
        """Check if Qdrant is reachable."""
        try:
            return self.qdrant_client.get_collections() is not None
        except Exception:
            return False
        
    def get_wsi_tiles(self, wsi_path: str) -> List[TilePayload]:
        
        # Define filter condition
        filter_condition = Filter(
            must=[FieldCondition(key="wsi_path",match=MatchValue(value=wsi_path))]
        )

        # Fetch all tiles with pagination
        all_tiles = []
        next_page = None

        while True:
            points, next_page = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_condition,
                limit=1000,
                offset=next_page
            )
            all_tiles.extend([TilePayload(**point.payload) for point in points])
            
            if next_page is None:  # No more data left
                break
        print(len(all_tiles))
        return all_tiles
    
    def run_query(
        self, 
        tile_uuid: str,
        max_hits: int = 100,
        min_similarity: float | None = 0.75,
        same_patient: bool | None = None,
        same_wsi: bool | None = None,
    ) -> List[TilePayload]:

        # get query tile (payload and vector)
        payload, query_tile_vector = self.get_tile(tile_uuid=tile_uuid)

        print(payload)

        # create query filters

        # run query
        search_result = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=query_tile_vector,
            query_filter=Filter(
                must_not=[FieldCondition(key="patient_id", match=MatchValue(value=payload.patient_id))]
            ),
            with_payload=True,
            score_threshold = min_similarity,
            limit=max_hits,
        ).points

        # formatting results to return
        results = []
        for scored_point in search_result:
            tile = TilePayload(**scored_point.payload)
            tile.score = scored_point.score
            results.append(tile)

        return results

    def get_tile(self, tile_uuid: str) -> Tuple[TilePayload, List[float]]:

        tile = self.qdrant_client.retrieve(
            collection_name=self.collection_name,
            ids=[tile_uuid],
            with_vectors=True
        )[0]

        tile_payload = TilePayload(**tile.payload)

        return tile_payload, tile.vector
