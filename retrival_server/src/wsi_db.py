import os
import sys
import logging
import sqlite3
from pathlib import Path
from typing import List, Optional

from src.data_models import WSI_ENTRY

# Set the root directory dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

class WSI_DB:
    def __init__(self, db_dir_path: str) -> None:
        """Initialize the WSI_DB class with SQLite."""
        # Database directory
        self.db_dir_path = db_dir_path
        self.db_path = os.path.join(self.db_dir_path, "wsi.db")
        self.log_path = os.path.join(self.db_dir_path, "wsi_db.log")

        # Ensure DB directory exists
        os.makedirs(self.db_dir_path, exist_ok=True)

        # Initialize logger
        self._init_logger()
        self.logger.info("Initializing WSI_DB instance")

        # Connect to database
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()

        # Initialize database
        self._init_db()
        self.logger.info("WSI database initialized successfully")

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
        """Ensure the WSI database table exists."""
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS wsi (
            wsi_path TEXT PRIMARY KEY,
            note TEXT,
            labels TEXT
        )
        """)
        self.conn.commit()
        self.logger.info("WSI table checked/created")

    def get_wsi(self, wsi_path: str) -> WSI_ENTRY:
        """Retrieve an entry from the WSI database."""
        self.cursor.execute("SELECT * FROM wsi WHERE wsi_path = ?", (wsi_path,))
        row = self.cursor.fetchone()

        if row:
            self.logger.info(f"Fetching WSI entry for path: {wsi_path}")
            return WSI_ENTRY(
                wsi_path=row[0],
                note=row[1] if row[1] is not None else None,
                labels=row[2].split(", ") if row[2] else []
            )

        self.logger.info(f"WSI path {wsi_path} not found in database, returning new entry")
        return WSI_ENTRY(wsi_path=wsi_path)
    

    def update_wsi(self, wsi_entry: WSI_ENTRY) -> bool:
        """Update, insert, or delete a WSI entry in the database."""
        try:
            self.cursor.execute("SELECT 1 FROM wsi WHERE wsi_path = ?", (wsi_entry.wsi_path,))
            exists = self.cursor.fetchone()

            # If note is None and labels is an empty list, delete the entry
            if wsi_entry.note is None and not wsi_entry.labels:
                if exists:
                    self.cursor.execute("DELETE FROM wsi WHERE wsi_path = ?", (wsi_entry.wsi_path,))
                    self.logger.info(f"Deleted WSI entry: {wsi_entry.wsi_path}")
                    self.conn.commit()
                return True  # Successful deletion

            labels_str = ", ".join(wsi_entry.labels)  # Convert list to comma-separated string

            if exists:
                # Update existing entry
                self.cursor.execute("""
                    UPDATE wsi
                    SET note = ?, labels = ?
                    WHERE wsi_path = ?
                """, (wsi_entry.note, labels_str, wsi_entry.wsi_path))
                self.logger.info(f"Updated existing WSI entry: {wsi_entry.wsi_path}")
            else:
                # Insert new entry
                self.cursor.execute("""
                    INSERT INTO wsi (wsi_path, note, labels)
                    VALUES (?, ?, ?)
                """, (wsi_entry.wsi_path, wsi_entry.note, labels_str))
                self.logger.info(f"Inserted new WSI entry: {wsi_entry.wsi_path}")

            self.conn.commit()
            return True
        except Exception as e:
            self.logger.error(f"Error updating WSI entry {wsi_entry.wsi_path}: {e}")
            return False
    

    def close(self):
        """Close the database connection."""
        self.conn.close()
        self.logger.info("Database connection closed")
