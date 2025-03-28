import os
from functools import lru_cache
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openslide import OpenSlide
import io
from PIL import Image
from openslide.deepzoom import DeepZoomGenerator
import numpy as np
from typing import Dict, Tuple, List
from starlette.responses import StreamingResponse
import json
import getpass
from src.qdrant_db import TileVectorDB
from src.wsi_db import WSI_DB
from src.data_models import WSI_ENTRY
from dotenv import load_dotenv
load_dotenv()


# Getting the application data path
APPLICATION_DATA_LOCATION = os.getenv("APPLICATION_DATA_LOCATION")

if not APPLICATION_DATA_LOCATION: 
    print("WARNING: No APPLICATION_DATA_LOCATION specified in .env. Using ~/wsi_viewer/ by default.")
    APPLICATION_DATA_LOCATION = "~/.wsi_viewer/"
else:
    print(f"Using the following application path: {APPLICATION_DATA_LOCATION}")


# Intializing the WSI pandas DB
wsi_db = WSI_DB(db_dir_path=APPLICATION_DATA_LOCATION)

# Initializing server
app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@lru_cache(maxsize=1)
def get_active_slide(sample_id: str) -> Tuple[OpenSlide, DeepZoomGenerator]:
    slide = OpenSlide(sample_id)
    deepzoom = DeepZoomGenerator(slide, tile_size=256, overlap=0, limit_bounds=False)
    return slide, deepzoom


@app.get("/home_directory/")
def home_directory() -> str:
    """Returns the path of the user's home directory."""
    return os.path.expanduser("~") + "/"


@app.get("/file_browse/")
def file_browse(dir_path: str) -> Dict[str, List[str]]:
    if not dir_path.startswith("/"):
        user_name = getpass.getuser()
        dir_path = f"/home/{user_name}/{dir_path}"
    
    if not os.path.isdir(dir_path):
        raise HTTPException(status_code=400, detail=f"Not a valid directory path: {dir_path}")
    
    try:
        dirs = []
        files = []
        
        for entry in os.listdir(dir_path):
            full_path = os.path.join(dir_path, entry)
            if os.path.isdir(full_path):
                dirs.append(entry)
            else:
                files.append(entry)

        # Sort directories and files alphabetically
        dirs.sort()
        files.sort()

        if dir_path != '/':
            dirs.insert(0, "..")
        
        return {"directories": dirs, "files": files}

    except PermissionError:
        raise HTTPException(status_code=403, detail=f"Permission Denied: {dir_path}")


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

    # get the wsi path
    wsi_path = sample_id

    # load slide (possibly already in memmory)
    slide, deepzoom = get_active_slide(sample_id=sample_id)

    # dimentions of the lowest resolution
    extent = deepzoom.level_dimensions[-1]
    level_tiles = np.array(deepzoom.level_tiles)

    # get the resolutions at each level
    resolutions = [2**i for i in range(deepzoom.level_count)][::-1]

    tiles = []
    
    try:
        wsi_entry = wsi_db.get_wsi(wsi_path=wsi_path)
        print(wsi_entry)
        labels = wsi_entry.labels
        note = wsi_entry.note
    except Exception as e:
        print(f"UNABLE TO GET WSI DATA FROM WSI DB. Error: {e}")


    return {
        "location": wsi_path,
        "level_count": deepzoom.level_count,
        "level_dimentions": deepzoom.level_dimensions,
        "extent": [0, 0, extent[0], extent[1]],
        "level_tiles": level_tiles.tolist(),
        "mpp_x": float(slide.properties.get("openslide.mpp-x", "0")),
        "mpp_y": float(slide.properties.get("openslide.mpp-y", "0")),
        "resolutions": resolutions,
        "tiles": tiles,
        "note": note,
        "labels": labels,
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


@app.put("/wsi_data_update/")
def wsi_data_update(wsi_entry: WSI_ENTRY):
    try:
        wsi_db.update_wsi(wsi_entry=wsi_entry)
        return {"success": True}  # Return a JSON response
    except Exception as e:
        print(f"Failed to update entry: {wsi_entry}. Exception: {e}")
        raise HTTPException(status_code=500, detail="Failed to update entry")



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
