import sys
from pathlib import Path
from functools import lru_cache
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import openslide
import io
from PIL import Image
from openslide.deepzoom import DeepZoomGenerator
import numpy as np
from typing import Dict, Tuple, List
from starlette.responses import StreamingResponse
import json
from src.qdrant_db import TileVectorDB


# Setup tile vector database
db = TileVectorDB("http://localhost:8080", "demo_collection")

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_ID_TO_WSI_PATH = "../TEST/SAMPLE_ID_TO_WSI.json"
with open(SAMPLE_ID_TO_WSI_PATH, "r") as f:
    SAMPLE_ID_TO_WSI = json.load(f)
    WSI_TO_SAMPLE_ID = {v: k for k, v in SAMPLE_ID_TO_WSI.items()}


@lru_cache(maxsize=1)
def get_active_slide(sample_id: str) -> Tuple[openslide.OpenSlide, DeepZoomGenerator]:
    slide = openslide.OpenSlide(SAMPLE_ID_TO_WSI[sample_id])
    deepzoom = DeepZoomGenerator(slide, tile_size=256, overlap=0, limit_bounds=False)
    return slide, deepzoom


@app.get("/load_wsi/")
def load_wsi(sample_id: str) -> bool:
    if sample_id not in SAMPLE_ID_TO_WSI:
        return False
    get_active_slide(sample_id)
    return True
    

@app.get("/metadata/")
def get_metadata(sample_id: str) -> Dict:

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
        "tiles": db.get_wsi_tiles(wsi_path=wsi_path)
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
    slide = openslide.OpenSlide(wsi_path)

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
    same_pt: bool|None = None,
    same_wsi: bool|None = None,
    same_dataset: bool|None = None,
    same_magnification: bool|None = None,
    max_hits: int = 5,
    min_score: float | None = None,
) -> List:

    print(f"running similarity query for tile id: {tile_uuid}")
    
    return db.run_query(tile_uuid=tile_uuid)


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
