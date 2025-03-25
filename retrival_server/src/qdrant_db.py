import sys
from pathlib import Path
from typing import List, Tuple
from qdrant_client import QdrantClient
from qdrant_client.models import ( 
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
)

# Set the root directory dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent  # Adjust as needed
sys.path.insert(0, str(ROOT_DIR))

from src.data_models import WSITilePayload, STAINS, MAGNIFICATIONS, ConceptPayload, QDRANT_ENTRY_TYPES


class TileVectorDB:
    def __init__(self, qdrant_address: str, collection_name: str, timeout:int = 300) -> None:
        self.qdrant_address = qdrant_address
        self.collection_name = collection_name
        self.timeout = timeout
        
        # Establish client
        try:
            self.qdrant_client = QdrantClient(location=self.qdrant_address, timeout=self.timeout)
        except Exception as e:
            raise Exception(f"Failed to initialize Qdrant client at {self.qdrant_address}: {e}")

        # Verify connection
        if not self._is_client_alive():
            raise Exception(f"Qdrant client at {self.qdrant_address} is unreachable!")
        
        # Verify valid collection
        available_collections = [
            collection.name for collection in self.qdrant_client.get_collections().collections
        ]
        print(f"Available collections: {available_collections}")
        if self.collection_name not in available_collections:
            raise Exception(f"Qdrant collection {self.collection_name} does not exist!")

        print(f"QdrantClient at {self.qdrant_address} successfully initialized!")

    def _is_client_alive(self) -> bool:
        """Check if Qdrant is reachable."""
        try:
            return self.qdrant_client.get_collections() is not None
        except Exception:
            return False
    

    def get_wsi_tiles(self, wsi_path: str) -> List[WSITilePayload]:
        
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
            all_tiles.extend([WSITilePayload(**point.payload) for point in points])
            
            if next_page is None:  # No more data left
                break

        return all_tiles
    
    def run_query(
        self, 
        tile_uuid: str,
        max_hits: int = 100,
        min_similarity: float | None = 0.75,
        same_patient: bool | None = None,
        same_wsi: bool | None = None,
        magnification_list: List[MAGNIFICATIONS] | None = None,
        stain_list: List[STAINS] | None = None,
        tag_filter: str | None = None,
        uuids: List[str] | None = None,
        wsi_paths: List[str] | None = None,
        entry_type: str = QDRANT_ENTRY_TYPES.WSI_TILE.value
    ) -> List[WSITilePayload]:
    
        # get query tile (payload and vector)
        try:
            payload, _ = self.get_tile(tile_uuid=tile_uuid)
        except:
            pass

        # create query filters
        must_filters = [FieldCondition(key="qdrant_entry_type", match=MatchValue(value=entry_type))]
        must_not_filters = [FieldCondition(key="uuid", match=MatchValue(value=tile_uuid))]
        should_filters = []

        if same_patient is False:
            must_not_filters.append(FieldCondition(key="patient_id", match=MatchValue(value=payload.patient_id)))
        if same_patient:
            must_filters.append(FieldCondition(key="patient_id", match=MatchValue(value=payload.patient_id)))
        
        if same_wsi == True:
            must_filters.append(FieldCondition(key="wsi_path", match=MatchValue(value=payload.wsi_path)))
        elif same_wsi == False:
            must_not_filters.append(FieldCondition(key="wsi_path", match=MatchValue(value=payload.wsi_path)))

        if magnification_list:
            must_filters.append(FieldCondition(key="magnification", match=MatchValue(value=magnification_list[0].value)))
        
        if stain_list:
            must_filters.append(FieldCondition(key="stain", match=MatchValue(value=stain_list[0].value)))

        if tag_filter:
            tags = [tag.strip() for tag in tag_filter.split(",")]
            for tag in tags:
                must_filters.append(FieldCondition(key="tags", match=MatchValue(value=tag)))

        if uuids:
            must_filters.append(
                FieldCondition(
                    key="uuid", 
                    match=MatchAny(any=uuids)
                )
            )

        if wsi_paths:
            must_filters.append(
                FieldCondition(
                    key="wsi_path", 
                    match=MatchAny(any=wsi_paths)
                )
            )
        
        # run query
        search_result = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            # query=query_tile_vector,
            query=tile_uuid,
            query_filter=Filter(
                must=must_filters,
                must_not=must_not_filters,
                should=should_filters
            ),
            with_payload=True,
            score_threshold=min_similarity,
            limit=max_hits,
        ).points

        # formatting results to return
        results = []
        for scored_point in search_result:
            tile = WSITilePayload(**scored_point.payload)
            tile.score = scored_point.score
            results.append(tile)

        return results
    
    
    def get_tile(self, tile_uuid: str) -> Tuple[WSITilePayload, List[float]]:

        tile = self.qdrant_client.retrieve(
            collection_name=self.collection_name,
            ids=[tile_uuid],
            with_vectors=True
        )[0]

        tile_payload = WSITilePayload(**tile.payload)

        return tile_payload, tile.vector


    def run_tile_to_concepts_query(self, tile_uuid: str) -> List[ConceptPayload]:

        concept_filter = Filter(
            must=[FieldCondition(
                key="qdrant_entry_type",
                match=MatchValue(value=QDRANT_ENTRY_TYPES.CONCEPT.value)
            )]
        )

        # run query
        search_result = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=tile_uuid,
            query_filter=concept_filter,
            with_payload=True,
            score_threshold=-1,
            limit=1_000_000,
        ).points

        # formatting results to return
        results = []
        for scored_point in search_result:
            tile = ConceptPayload(**scored_point.payload)
            tile.score = scored_point.score
            results.append(tile)

        return results

    def get_all_concepts(self) -> List[ConceptPayload]:

        concept_filter = Filter(
            must=[FieldCondition(
                key="qdrant_entry_type",
                match=MatchValue(value=QDRANT_ENTRY_TYPES.CONCEPT.value)
            )]
        )

        # Fetch all tiles with pagination
        all_concepts = []
        next_page = None

        while True:
            points, next_page = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=concept_filter,
                limit=1000,
                offset=next_page
            )
            all_concepts.extend([ConceptPayload(**point.payload) for point in points])
            
            if next_page is None:  # No more data left
                break

        return all_concepts
    