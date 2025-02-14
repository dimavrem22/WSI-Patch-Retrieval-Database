import React, { useEffect, useState } from "react";
import { Tile } from "../types";

interface TileComponentProps {
  tile: Tile;
}

const TileComponent: React.FC<TileComponentProps> = ({ tile }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTileImage = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/tile_image/?wsi_path=${tile.wsi_path}&x=${tile.x}&y=${tile.y}&size=${tile.size}`
        );
        if (!response.ok) {
          throw new Error("Failed to load tile image");
        }
        const blob = await response.blob();
        setImageSrc(URL.createObjectURL(blob));
      } catch (err) {
        setError("Error loading tile image");
      }
    };

    fetchTileImage();
  }, [tile]);

  if (error) return <div className="error-message">{error}</div>;
  if (!imageSrc) return <div>Loading...</div>;

  return (
    <div className="tile-container">
      <img src={imageSrc} alt="Tile" className="tile-image" width={256} height={256} />
      <div className="tile-info">
        <span><strong>Score:</strong> {tile.score ? tile.score.toFixed(3) : "N/A"}, </span>
        <span><strong>Dataset:</strong> {tile.dataset}, </span>
        <span><strong>Mag:</strong> {tile.magnification}, </span>
        <span><strong>Patient:</strong> {tile.patient_id}, </span>
        <span><strong>Stain:</strong> {tile.stain}</span>
      </div>
    </div>
  );
};

export default TileComponent;