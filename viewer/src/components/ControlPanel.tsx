import { useState } from "react";
import { TileMagnification, toTileMagnification} from "../types";

type ControlPanelProps = {
  onImagePathChange: (path: string) => void;
  onTileMagnificationChange: (tileMagnification: TileMagnification) => void;
};

const ControlPanel: React.FC<ControlPanelProps> = ({ onImagePathChange, onTileMagnificationChange }) => {
  const [imagePath, setImagePath] = useState<string>("");
  const [tileOption, setTileOption] = useState<string>("none");

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = event.target.value;
    setImagePath(newPath);
    onImagePathChange(newPath);
  };

  const handleTileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTileSize = event.target.value;
    setTileOption(newTileSize);
    onTileMagnificationChange(toTileMagnification(newTileSize));
  };

  return (
    <div className="control-panel" style={{ padding: "10px", border: "1px solid #ccc" }}>
      <label>
        Image Path:
        <input
          type="text"
          value={imagePath}
          onChange={handlePathChange}
          placeholder="Enter image path"
          style={{ marginLeft: "10px", padding: "5px", width: "200px" }}
        />
        <button>🔍</button>
      </label>
      <br />
      <label>
        Tile Magnification:
        <select
          value={tileOption}
          onChange={handleTileChange}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="none">None</option>
          <option value="5x">5x</option>
          <option value="10x">10x</option>
          <option value="20x">20x</option>
        </select>
      </label>
    </div>
  );
};

export default ControlPanel;
