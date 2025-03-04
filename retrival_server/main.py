import os
from functools import lru_cache
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from openslide import OpenSlide
import io
from PIL import Image
from openslide.deepzoom import DeepZoomGenerator
import numpy as np
from typing import Dict, Tuple, List
from starlette.responses import StreamingResponse
import json
from src.qdrant_db import TileVectorDB
from src.data_models import STAINS, MAGNIFICATIONS, TilePayload
 

db = TileVectorDB("http://localhost:8080", "demo_lung_cancer")
SAMPLE_ID_TO_WSI_PATH = "../TEST/DFCI_sample_ID_to_WSI.json"

# db = TileVectorDB("http://localhost:8080", "demo_collection_big")
# SAMPLE_ID_TO_WSI_PATH = "/home/dmv626/WSI-Patch-Retrieval-Database/TEST/SAMPLE_ID_TO_WSI_BIG.json"

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open(SAMPLE_ID_TO_WSI_PATH, "r") as f:
    SAMPLE_ID_TO_WSI = json.load(f)
    WSI_TO_SAMPLE_ID = {v: k for k, v in SAMPLE_ID_TO_WSI.items()}


@lru_cache(maxsize=1)
def get_active_slide(sample_id: str) -> Tuple[OpenSlide, DeepZoomGenerator]:
    slide = OpenSlide(SAMPLE_ID_TO_WSI[sample_id])
    deepzoom = DeepZoomGenerator(slide, tile_size=256, overlap=0, limit_bounds=False)
    return slide, deepzoom


@app.get("/load_wsi/")
def load_wsi(sample_id: str) -> bool:
    if os.path.exists(sample_id):
        SAMPLE_ID_TO_WSI[sample_id] = sample_id
        WSI_TO_SAMPLE_ID[sample_id] = sample_id
    if sample_id not in SAMPLE_ID_TO_WSI:
        return False
    get_active_slide(sample_id)
    return True
    

@app.get("/metadata/")
def get_metadata(sample_id: str) -> Dict:

    if os.path.exists(sample_id):
        SAMPLE_ID_TO_WSI[sample_id] = sample_id
        WSI_TO_SAMPLE_ID[sample_id] = sample_id

    # get the wsi path
    wsi_path = SAMPLE_ID_TO_WSI[sample_id]

    # load slide (possibly already in memmory)
    slide, deepzoom = get_active_slide(sample_id=sample_id)

    # dimentions of the lowest resolution
    extent = deepzoom.level_dimensions[-1]
    level_tiles = np.array(deepzoom.level_tiles)

    # first layer with more than 1 tile in each x and y axes
    min_layer = np.where((level_tiles[:, 0] > 1) & (level_tiles[:, 1] > 1))[0][0]
    min_zoom = int(deepzoom.level_count - min_layer)

    resolutions = [2**i for i in range(deepzoom.level_count)][::-1]

    try:
        tiles = db.get_wsi_tiles(wsi_path=wsi_path)
    except:
        print("UNABLE TO GET TILES FROM QDRANT")
        tiles = []

    return {
        "level_count": deepzoom.level_count,
        "level_dimentions": deepzoom.level_dimensions,
        "extent": [0, 0, extent[0], extent[1]],
        "level_tiles": level_tiles.tolist(),
        "startZoom": int(np.min([min_zoom + 3, slide.level_count - 3])),
        "minZoom": min_zoom,
        "maxZoom": deepzoom.level_count,
        "mpp_x": float(slide.properties.get("openslide.mpp-x", "0")),
        "mpp_y": float(slide.properties.get("openslide.mpp-y", "0")),
        "resolutions": resolutions,
        "tiles": tiles
    }


@app.get("/tiles/{z}/{x}/{y}/")
def get_tile(sample_id: str, z: int, x: int, y: int) -> StreamingResponse:
    """
    Fetch a tile using DeepZoom.
    - z: DeepZoom level (0 = most zoomed-out, max = highest resolution)
    - x, y: Tile coordinates in DeepZoom format
    """

    _, deepzoom = get_active_slide(sample_id=sample_id)

    try:
        tile = deepzoom.get_tile(z, (x, y))
        if tile.size != (256, 256):
            tile = resize_and_fill(
                tile, target_size=(256, 256), fill_color=(255, 255, 255)
            )
    except ValueError:
        tile = Image.new("RGB", (256, 256), (255, 255, 255))
    return stream_tile(tile)

@app.get("/tile_image/")
def get_tile_image(wsi_path: str, x: int, y: int, size: int) -> StreamingResponse:
    slide = OpenSlide(wsi_path)

    # Get the best level that can give us a 256x256 tile efficiently
    best_level = slide.get_best_level_for_downsample(size / 256)
    level_downsample = slide.level_downsamples[best_level]

    # Scale x, y, and size to match the selected level
    adj_x = int(x / level_downsample)
    adj_y = int(y / level_downsample)
    adj_size = int(size / level_downsample)

    # Read the adjusted region at the selected level
    tile = slide.read_region((adj_x, adj_y), best_level, (adj_size, adj_size))

    # Resize tile to 256x256
    tile = tile.resize((256, 256))

    return stream_tile(tile) 

@app.get("/query_similar_tiles/")
def query_similar_tiles(
    tile_uuid: str,
    max_hits: int = 5,
    min_score: float | None = None,
    same_pt: bool | None = None,
    same_wsi: bool | None = None,
    magnification_list: List[MAGNIFICATIONS] = Query(default=[]),  # Ensure lists are properly parsed
    stain_list: List[STAINS] = Query(default=[]),
    tag_filter: str | None = None,
) -> List[TilePayload]:

    print(f"Running similarity query for tile ID: {tile_uuid}")

    return db.run_query(
        tile_uuid=tile_uuid,
        max_hits=max_hits,
        min_similarity=min_score,
        same_patient=same_pt,
        same_wsi=same_wsi,
        magnification_list=magnification_list,
        stain_list=stain_list,
        tag_filter=tag_filter,
    )

@app.get("/similar_tiles_heatmap/")
def query_similar_tiles(
    tile_uuid: str,
    magnification: MAGNIFICATIONS | None = None,
) -> List[TilePayload]:
    
    tile_payload, _ = db.get_tile(tile_uuid=tile_uuid)
    # wsi_tiles = db.get_wsi_tiles(wsi_path=tile_payload.wsi_path)

    if not magnification:
        magnification = tile_payload.magnification

    print(f"Running tile similarity heatmap: {tile_uuid}")

    result = db.run_query(
        tile_uuid=tile_uuid,
        max_hits=1_000_000,
        min_similarity=-2,
        same_wsi=True,
        magnification_list=[magnification],
    )
    if magnification == tile_payload.magnification:
        tile_payload.score = 1.0
        result.append(tile_payload)

    return result


def resize_and_fill(
    image: Image,
    target_size: Tuple[int, int] = (256, 256),
    fill_color: Tuple[int, int, int] = (255, 255, 255),
) -> Image:
    """Resize an image to a target size and fill the rest with a color

    Args:
        image (Image): Image to resize/fill
        target_size (Tuple[int, int], optional): Output size. Defaults to (256, 256).
        fill_color (Tuple[int, int, int], optional): Color to fill in RGB. Defaults to (255, 255, 255).

    Returns:
        Image: Resized and filled image
    """
    current_size = image.size

    if (current_size[0] < target_size[0]) or (current_size[1] < target_size[1]):
        new_image = Image.new("RGB", target_size, fill_color)
        new_image.paste(image, (0, 0))
        image = new_image
    return image

def stream_tile(tile: Image) -> StreamingResponse:
    tile = tile.convert("RGB")
    img_byte_array = io.BytesIO()
    tile.save(img_byte_array, format="JPEG")
    img_byte_array.seek(0)
    return StreamingResponse(content=img_byte_array, media_type="image/jpeg")
