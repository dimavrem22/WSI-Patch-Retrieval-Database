import { useState } from "react";
import { toTileMagnification, TileMagnification, Stains } from "../types";
import { useGlobalStore } from "../store/useGlobalStore";
import { useQueryStore } from "../store/useTileSearchStore";
import { useTileHeatmapParamsStore } from "../store/useTileHeatmapStore";

interface ControlPanelProps {
  onQueryRun: () => void;
  onTileHeatmapQuery: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onQueryRun, onTileHeatmapQuery}) => {
  const {
    selectedTile,
    setViewMagnification,
    setCurrentSlide,
    setSelectedTile,
    heatmap,
  } = useGlobalStore();

  const {
    maxHits,
    minSimilarity,
    magnificationList,
    stainList,
    samePatient,
    sameWSI,
    setMaxHits,
    setMinSimilarity,
    setMagnificationList,
    setStainList,
    setSamePatient,
    setSameWSI,
    setTagFilter,
  } = useQueryStore();

  const {
    magnification,
    setMagnification,
    showHeatmap, 
    setShowHeatmap,
  } = useTileHeatmapParamsStore();


  const [sampleID, setSampleId] = useState("");
  const [tileOption, setTileOption] = useState("none");
  const [samePatientQuery, setSamePatientQuery] = useState(samePatient === null ? "NA" : samePatient ? "same" : "other");
  const [sameWsiQuery, setSameWsiQuery] = useState(sameWSI === null ? "NA" : sameWSI ? "same" : "other");
  const [tagFilter, setTagFilterState] = useState("");
  const [tileSimilaritySearchVisible, setTileSimilaritySearchVisible] = useState(false);
  const [tileSimilarityHeatmapVisible, setTileSimilarityHeatmapVisible] = useState(false);

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
          }}
          placeholder="Enter sample ID"
          style={styles.input}
        />
      </label>
      <button onClick={() => setCurrentSlide(sampleID)}>🔍</button>
      <br /><br />

      <Dropdown
        label="Tile Magnification:"
        value={tileOption}
        options={["NA", "5x", "10x", "20x"]}
        onChange={(value) => {
          setTileOption(value);
          setViewMagnification(toTileMagnification(value));
        }}
      />
      <br /><br />

      <button onClick={() => setTileSimilaritySearchVisible(!tileSimilaritySearchVisible)} style={styles.fullWidthButton}>
        Tile Similarity Search {tileSimilaritySearchVisible ? "▼" : "▶"}
      </button>
      <br /><br />

      {tileSimilaritySearchVisible && (
        <div>
          <label>
            Max Hits:
            <input
              type="number"
              value={maxHits}
              onChange={(e) => setMaxHits(Number(e.target.value))}
              style={styles.input}
            />
          </label>
          <br /><br />

          <label>
            Min Similarity:
            <input
              type="number"
              step="0.01"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              style={styles.input}
            />
          </label>
          <br /><br />
          
          <Dropdown
            label="Patient Filter:"
            value={samePatientQuery}
            options={["NA", "same", "other"]}
            onChange={(value) => {
              setSamePatientQuery(value);
              setSamePatient(value === "same" ? true : value === "other" ? false : null);
            }}
          />
          <br /><br />

          <Dropdown
            label="WSI Filter:"
            value={sameWsiQuery}
            options={["NA", "same", "other"]}
            onChange={(value) => {
              setSameWsiQuery(value);
              setSameWSI(value === "same" ? true : value === "other" ? false : null);
            }}
          />
          <br /><br />

          <Dropdown
            label="Magnification:"
            value={magnificationList ? magnificationList.join(", ") : "None"}
            options={["NA", ...Object.values(TileMagnification)]}
            onChange={(value) =>
              setMagnificationList(value !== "NA" ? [value as TileMagnification] : null)
            }
          />
          <br /><br />

          <Dropdown
            label="Stains:"
            value={stainList ? stainList.join(", ") : "NA"}
            options={["NA", ...Object.values(Stains)]}
            onChange={(value) => setStainList(value !== "NA" ? [value as Stains] : null)}
          />
          <br /><br />

          <label>
            Tag Filter:
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => {
                const value = e.target.value;
                setTagFilterState(value);
                setTagFilter(value.trim() === "" ? null : value);
              }}
              placeholder="Enter tag filter"
              style={styles.input}
            />
          </label>
          <br /><br />
          <button disabled={selectedTile==null} onClick={onQueryRun}>SEARCH</button>
          <br /><br />
        </div>
      )}
      <button onClick={() => setTileSimilarityHeatmapVisible(!tileSimilarityHeatmapVisible)} style={styles.fullWidthButton}>
        Tile Similarity Heatmap {tileSimilarityHeatmapVisible ? "▼" : "▶"}
      </button>
      <br /><br />
      {tileSimilarityHeatmapVisible && (
        <div>
          <Dropdown
            label="Tile Magnification:"
            value={magnification == null ? "NA" : magnification}
            options={["NA", "5x", "10x", "20x"]}
            onChange={(value) => {
              setMagnification(value !== "NA" ? value as TileMagnification : null);
            }}
          />
          <br /><br />
          <label>
            Show Heatmap:
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap?.(e.target.checked)}
              disabled={heatmap == null}
            />
          </label>
          <br /><br />
          <button disabled={selectedTile==null} onClick={onTileHeatmapQuery}>Generate Heatmap</button>
          </div>
      )}
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
  fullWidthButton: { width: "100%", padding: "10px", fontSize: "16px" },
};

export default ControlPanel;
