import json
import sys
from pathlib import Path
import os
import pandas as pd
from uuid import uuid4
import torch
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, PointStruct, Filter, FieldCondition, MatchValue

# Set the root directory dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent  # Adjust as needed
sys.path.insert(0, str(ROOT_DIR))

from src.data_models import STAINS, MAGNIFICATIONS, TilePayload, DATASETS


# DATABASE PARAMS
QDRANT_ADDRESS = "http://localhost:8000"
COLLECTION_NAME = "demo_lung_cancer"
DATASET = DATASETS.DFCI
MAGNIFICATION = MAGNIFICATIONS.X20
STAIN = STAINS.HE
VECTOR_DIM = 2560

RARE_CANCER_LIST = [
    "Lung Adenosquamous Carcinoma",
    "Lung Carcinoid",
    "Lung Neuroendocrine Tumor",
]

COMMON_CANCERS_LIST = [
    "Lung Adenocarcinoma",
    "Lung Squamous Cell Carcinoma",
    "Small Cell Lung Cancer",
]


# DATA PATHS
LABEL_CSV_PATH = "/home/dmv626/WSI-Patch-Retrieval-Database/TEST/DFCI_Lung_coarse_clean.csv"
COORDINATES_DIR = "/n/scratch/users/d/dmv626/data/DFCI-Lung-No-Pen/coordinates_"
FEATURES_DIR = "/n/scratch/users/d/dmv626/data/DFCI-Lung-No-Pen/VIRCHOW2-Tile-Features_"


def main():

    # Start an in-memory Qdrant instance
    client = QdrantClient(location="http://localhost:8000")

    # Create Collection
    # client.create_collection(
    #     collection_name=COLLECTION_NAME,
    #     vectors_config=VectorParams(size=VECTOR_DIM, distance="Cosine"),
    # )
    # print("Collection Made!")

    # load csv file
    df = pd.read_csv(LABEL_CSV_PATH)
    df_rare = df[df["class_name"].isin(RARE_CANCER_LIST)]
    df_rare.to_csv("/home/dmv626/WSI-Patch-Retrieval-Database/TEST/DFCI_rare.csv", index=False)

    sample_to_wsi_dict = {}

    # COMMON CANCERS
    for common_cancer in COMMON_CANCERS_LIST:
        df_common = df[df["class_name"]==common_cancer]

        idx = 0

        for _, row in df_common.iterrows():
            
            if idx >= 10:
                break

            tags = ['common', row.class_name.lower()]
            wsi_path = row.slide_path
            slide_id = row.slide_id.split(".")[0]
            patient_id = row.case_id

            sample_to_wsi_dict[slide_id] = wsi_path

            coord_path = COORDINATES_DIR + f"{MAGNIFICATION.value}/{slide_id}.json"
            features_path = FEATURES_DIR + f"{MAGNIFICATION.value}/{slide_id}.pt"

            if not (os.path.exists(coord_path) and os.path.exists(features_path)):
                print(f"ISSUE:  {coord_path} or {features_path} does not exist!")

            add_wsi_to_collection(
                client=client,
                collection_name=COLLECTION_NAME,
                wsi_path=wsi_path,
                features_path=features_path,
                coord_path=coord_path,
                source_dataset=DATASET,
                magnification=MAGNIFICATION,
                tags=tags,
                stain=STAIN,
                patient_id=patient_id
            )
            idx += 1


    # RARE CANCERS
    for _, row in df_rare.iterrows():

        tags = ['rare', row.class_name.lower()]
        wsi_path = row.slide_path
        slide_id = row.slide_id.split(".")[0]
        patient_id = row.case_id

        sample_to_wsi_dict[slide_id] = wsi_path

        coord_path = COORDINATES_DIR + f"{MAGNIFICATION.value}/{slide_id}.json"
        features_path = FEATURES_DIR + f"{MAGNIFICATION.value}/{slide_id}.pt"

        if not (os.path.exists(coord_path) and os.path.exists(features_path)):
            print(f"ISSUE:  {coord_path} or {features_path} does not exist!")

        # add_wsi_to_collection(
        #     client=client,
        #     collection_name=COLLECTION_NAME,
        #     wsi_path=wsi_path,
        #     features_path=features_path,
        #     coord_path=coord_path,
        #     source_dataset=DATASET,
        #     magnification=MAGNIFICATION,
        #     tags=tags,
        #     stain=STAIN,
        #     patient_id=patient_id
        # )

    with open("/home/dmv626/WSI-Patch-Retrieval-Database/TEST/DFCI_sample_ID_to_WSI.json", "w") as f:
        json.dump(sample_to_wsi_dict, f, indent=4)


def add_wsi_to_collection(
    client,
    collection_name,
    wsi_path,
    coord_path,
    features_path,
    source_dataset,
    magnification,
    tags,
    stain,
    patient_id,
):
    # open coordinates
    with open(coord_path, "r") as f:
        data = json.load(f)
        coords = data['coordinates']
        meta = data['metadata']
        patch_size = int(data['patch_size'][0])

    # open features
    tile_features = torch.load(features_path, map_location=torch.device('cpu'), weights_only=False)

    # get list of points and batch insert every 50 tiles
    points = []
    batch_size = 50

    for i, (coord, features) in enumerate(zip(coords, tile_features)):
        uuid = str(uuid4())
        
        payload = TilePayload(
            uuid=uuid,
            dataset=source_dataset,
            wsi_path=str(wsi_path),
            patient_id=str(patient_id),
            magnification=magnification,
            stain=stain,
            x=coord[0],
            y=coord[1],
            size=patch_size,
            tags=tags,
        )
        
        point = PointStruct(id=uuid, vector=features.tolist(), payload=payload.model_dump())
        points.append(point)

        # Insert every batch_size tiles
        if (i + 1) % batch_size == 0:
            operation_info = client.upsert(
                collection_name=collection_name,
                wait=True,
                points=points,
            )
            print(f"Inserted {len(points)} tiles")
            points = []  # Reset points list

    # Insert remaining points if any
    if points:
        operation_info = client.upsert(
            collection_name=collection_name,
            wait=True,
            points=points,
        )
        print(f"Inserted remaining {len(points)} tiles")


if __name__ == "__main__":
    main()