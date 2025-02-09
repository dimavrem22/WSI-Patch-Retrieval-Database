import { useState } from "react";
import { TileMagnification, toTileMagnification} from "../types";

type ControlPanelProps = {
  onSampleIdChange: (smapleId: string) => void;
  onTileMagnificationChange: (tileMagnification: TileMagnification) => void;
};

const ControlPanel: React.FC<ControlPanelProps> = (
  { 
    onSampleIdChange,
    onTileMagnificationChange
  }
) => {
  const [sampleID, setSampleId] = useState<string>("");
  const [tileOption, setTileOption] = useState<string>("none");

  const handleSampleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSampleId = event.target.value;
    setSampleId(newSampleId);
  };

  const handleTileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTileSize = event.target.value;
    setTileOption(newTileSize);
    onTileMagnificationChange(toTileMagnification(newTileSize));
  };

  return (
    <div className="control-panel" style={{ padding: "10px", border: "1px solid #ccc" }}>
      <label>
        Sample:
        <input
          type="text"
          value={sampleID}
          onChange={handleSampleIdChange}
          placeholder="Enter sample id:"
          style={{ marginLeft: "10px", padding: "5px", width: "100px" }}
        />
        <button onClick={() => onSampleIdChange(sampleID)}>🔍</button>
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
