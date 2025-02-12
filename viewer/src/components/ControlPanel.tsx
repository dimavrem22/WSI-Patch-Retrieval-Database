import { useState } from "react";
import { TileMagnification, toTileMagnification} from "../types";

type ControlPanelProps = {
  onSampleIdChange: (smapleId: string) => void;
  onQueryRun: () => void;
  onTileMagnificationChange: (tileMagnification: TileMagnification) => void;
};

const ControlPanel: React.FC<ControlPanelProps> = (
  { 
    onQueryRun,
    onSampleIdChange,
    onTileMagnificationChange
  }
) => {
  const [sampleID, setSampleId] = useState<string>("");
  const [tileOption, setTileOption] = useState<string>("none");
  const [samePatientQuery, setSamePatientQuery] = useState<string>("NA");
  const [sameWsiQuery, setSameWsiQuery] = useState<string>("NA");

  const handleSampleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSampleId = event.target.value;
    setSampleId(newSampleId);
  };

  const handleSameWSIQuery = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSameWsiQuery(event.target.value);
  };

  const handleSamePatientQuery = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSamePatientQuery(event.target.value);
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
      <br /><br />
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
      <br /><br />
      <label>
        Patient Query Option:
        <select
          value={samePatientQuery}
          onChange={handleSamePatientQuery}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="NA">NA</option>
          <option value="same">Same Patient</option>
          <option value="other">Other Patients</option>
        </select>
      </label>
      <br /><br />
      <label>
        WSI Query Option:
        <select
          value={sameWsiQuery}
          onChange={handleSameWSIQuery}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="NA">NA</option>
          <option value="same">Same WSI</option>
          <option value="other">Other WSI</option>
        </select>
      </label>
      <br /><br />
      <button onClick={() => onQueryRun()}>RUN QUERY</button>
    </div>
  );
};

export default ControlPanel;
