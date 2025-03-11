import os
import sys
import logging
from pathlib import Path
import pandas as pd

# Set the root directory dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent  # Adjust as needed
sys.path.insert(0, str(ROOT_DIR))

from src.data_models import WSI_ENTRY

class WSI_DB:
    
    def __init__(self, db_dir_path: str) -> None:
        # tables
        self.wsi_table = None

        # data paths
        self.db_dir_path = db_dir_path
        self.wsi_table_path = os.path.join(self.db_dir_path, "wsi.csv")
        self.log_path = os.path.join(self.db_dir_path, "wsi_db.log")

        # Ensure DB path exists
        if not os.path.exists(self.db_dir_path):
            os.makedirs(self.db_dir_path)
            print(f"Created {self.db_dir_path}")
        
        # Initialize logger
        self._init_logger()
        self.logger.info("Initializing WSI_DB instance")

        # Ensure the database directory and files exist
        self._init_db()
        
        # Load the database
        self._load_db()
        self.logger.info("WSI database loaded successfully")

    def _init_logger(self):
        """Initialize the logger."""
        self.logger = logging.getLogger("WSI_DB")
        self.logger.setLevel(logging.INFO)
        
        file_handler = logging.FileHandler(self.log_path)
        file_handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)

    def _init_db(self) -> None:
        """Ensure the WSI database directory and table exist."""
        if not os.path.exists(self.wsi_table_path):
            wsi_table = pd.DataFrame(columns=[field for field in WSI_ENTRY.model_fields])
            wsi_table.to_csv(self.wsi_table_path, index=False)
            self.logger.info(f"Created WSI table at {self.wsi_table_path}")

    def _load_db(self) -> None:
        """Load the WSI database from CSV."""
        if os.path.exists(self.wsi_table_path):
            self.wsi_table = pd.read_csv(self.wsi_table_path)
        else:
            self.wsi_table = pd.DataFrame(columns=[field for field in WSI_ENTRY.model_fields])

    def get_wsi(self, wsi_path: str) -> WSI_ENTRY:
        """Retrieve an entry from the WSI database."""
        entry = self.wsi_table[self.wsi_table.wsi_path == wsi_path]
        
        if entry.empty:
            self.logger.info(f"WSI path {wsi_path} not found in database, returning new entry")
            return WSI_ENTRY(wsi_path=wsi_path)
        
        self.logger.info(f"Fetching WSI entry for path: {wsi_path}")
        return WSI_ENTRY(**entry.iloc[0].to_dict())

    def update_wsi(self, wsi_entry: WSI_ENTRY) -> bool:
        """Update or insert a WSI entry in the database."""
        try:
            entry_index = self.wsi_table[self.wsi_table.wsi_path == wsi_entry.wsi_path].index
            if not entry_index.empty:
                self.wsi_table.loc[entry_index, :] = wsi_entry.__dict__
                self.logger.info(f"Updated existing WSI entry: {wsi_entry.wsi_path}")
            else:
                self.wsi_table = pd.concat([self.wsi_table, pd.DataFrame([wsi_entry.__dict__])], ignore_index=True)
                self.logger.info(f"Inserted new WSI entry: {wsi_entry.wsi_path}")
            
            self.wsi_table.to_csv(self.wsi_table_path, index=False)
            return True
        except Exception as e:
            self.logger.error(f"Error updating WSI entry {wsi_entry.wsi_path}: {e}")
            return False
