import { useState } from "react";
import { TileMagnification, toTileMagnification } from "../types";

type ControlPanelProps = {
  onSampleIdChange: (sampleId: string) => void;
  onQueryRun: () => void;
  onTileMagnificationChange: (tileMagnification: TileMagnification) => void;
};

type InputFieldProps = {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  onQueryRun,
  onSampleIdChange,
  onTileMagnificationChange,
}) => {
  const [sampleID, setSampleId] = useState<string>("");
  const [tileOption, setTileOption] = useState<string>("none");
  const [samePatientQuery, setSamePatientQuery] = useState<string>("NA");
  const [sameWsiQuery, setSameWsiQuery] = useState<string>("NA");

  return (
    <div className="control-panel" style={styles.panel}>
      <InputField
        label="Sample:"
        type="text"
        value={sampleID}
        onChange={setSampleId}
        placeholder="Enter sample ID"
      />
      <button onClick={() => onSampleIdChange(sampleID)}>🔍</button>
      <br/><br/>
      <Dropdown
        label="Tile Magnification:"
        value={tileOption}
        options={["none", "5x", "10x", "20x"]}
        onChange={(value) => {
          setTileOption(value);
          onTileMagnificationChange(toTileMagnification(value));
        }}
      />
      <br/><br/>
      <Dropdown
        label="Patient Query Option:"
        value={samePatientQuery}
        options={["NA", "same", "other"]}
        onChange={setSamePatientQuery}
      />
      <br/><br/>
      <Dropdown
        label="WSI Query Option:"
        value={sameWsiQuery}
        options={["NA", "same", "other"]}
        onChange={setSameWsiQuery}
      />
      <br/><br/>
      <button onClick={onQueryRun}>RUN QUERY</button>
    </div>
  );
};

const InputField: React.FC<InputFieldProps> = ({ label, type, value, onChange, placeholder }) => (
  <label>
    {label}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={styles.input}
    />
  </label>
);

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange }) => (
  <label>
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.select}
    >
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
  input: { marginLeft: "10px", padding: "5px", width: "100px" },
  select: { marginLeft: "10px", padding: "5px" },
};

export default ControlPanel;