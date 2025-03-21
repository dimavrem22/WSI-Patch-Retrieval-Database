import pandas as pd
import sys
from pathlib import Path
import pandas as pd


# Set the root directory dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent  # Adjust as needed
sys.path.insert(0, str(ROOT_DIR))

from src.wsi_db import WSI_DB
from src.data_models import WSI_ENTRY


# Define constants
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

LABEL_CSV_PATH = "/home/dmv626/WSI-Patch-Retrieval-Database/TEST/DFCI_Lung_coarse_clean.csv"
DB_DIR = "/n/scratch/users/d/dmv626/.wsi_viewer"

# Load data
df = pd.read_csv(LABEL_CSV_PATH)
df['wsi_path'] = df['slide_path']

# Build 'labels' column as list
df['labels'] = df['class_name'].apply(lambda x: [x])
df.loc[df["class_name"].isin(RARE_CANCER_LIST), 'labels'] = df.loc[df["class_name"].isin(RARE_CANCER_LIST), 'labels'].apply(lambda x: x + ["rare"])
df.loc[df["class_name"].isin(COMMON_CANCERS_LIST), 'labels'] = df.loc[df["class_name"].isin(COMMON_CANCERS_LIST), 'labels'].apply(lambda x: x + ["common"])

# Add empty note column
df['note'] = ""

# Initialize WSI_DB
db = WSI_DB(db_dir_path=DB_DIR)

# Insert entries into database
for _, row in df.iterrows():
    entry = WSI_ENTRY(
        wsi_path=row['wsi_path'],
        note=row['note'],
        labels=row['labels']
    )
    success = db.update_wsi(entry)
    if not success:
        print(f"Failed to insert/update: {row['wsi_path']}")

# Close connection
db.close()

# Optional: print the dataframe
print(df[['wsi_path', 'labels', 'note']])