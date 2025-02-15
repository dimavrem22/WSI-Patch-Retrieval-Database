import { useState } from "react";
import { toTileMagnification } from "../types";
import { useGlobalStore } from "../store/useGlobalStore";

interface ControlPanelProps {
  onQueryRun: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onQueryRun }) => {
  
  const {
      setViewMagnification,
      setCurrentSlide,
      setSelectedTile,
    } = useGlobalStore();

  const [sampleID, setSampleId] = useState("");
  const [tileOption, setTileOption] = useState("none");
  const [samePatientQuery, setSamePatientQuery] = useState("NA");
  const [sameWsiQuery, setSameWsiQuery] = useState("NA");

  return (
    <div className="control-panel" style={styles.panel}>
      <label>
        Sample:
        <input
          type="text"
          value={sampleID}
          onChange={(e) => {
            setSelectedTile(null);
            setSampleId(e.target.value);
          }
          }
          placeholder="Enter sample ID"
          style={styles.input}
        />
      </label>
      <button onClick={() => setCurrentSlide(sampleID)}>🔍</button>
      <br /><br />
      <Dropdown
        label="Tile Magnification:"
        value={tileOption}
        options={["none", "5x", "10x", "20x"]}
        onChange={(value) => {
          setTileOption(value);
          setViewMagnification(toTileMagnification(value));
        }}
      />
      <br /><br />
      <Dropdown
        label="Patient Query Option:"
        value={samePatientQuery}
        options={["NA", "same", "other"]}
        onChange={setSamePatientQuery}
      />
      <br /><br />
      <Dropdown
        label="WSI Query Option:"
        value={sameWsiQuery}
        options={["NA", "same", "other"]}
        onChange={setSameWsiQuery}
      />
      <br /><br />
      <button onClick={onQueryRun}>RUN QUERY</button>
    </div>
  );
};

const Dropdown: React.FC<{ label: string; value: string; options: string[]; onChange: (value: string) => void }> = ({
  label,
  value,
  options,
  onChange,
}) => (
  <label>
    {label}
    <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.select}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const styles = {
  panel: { padding: "10px", border: "1px solid #ccc" },
  input: { marginLeft: "10px", padding: "5px", width: "150px" },
  select: { marginLeft: "10px", padding: "5px" },
};

export default ControlPanel;
