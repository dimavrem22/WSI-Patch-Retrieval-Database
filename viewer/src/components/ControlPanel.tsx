import { useState, useEffect } from "react";
import { toTileMagnification, TileMagnification, Stains } from "../types";
import { useGlobalStore } from "../store/useGlobalStore";
import { useQueryStore } from "../store/useTileSearchStore";
import { useTileHeatmapParamsStore } from "../store/useTileHeatmapStore";
import FileBrowser from "./FileBrowser";
import ConceptBrowser from "./ConceptBrowser";

interface ControlPanelProps {
  onQueryRun: () => void;
  onTileHeatmapQuery: () => void;
  onTileConceptQuery: () => void;
  onConceptHeatmapQuery: () => void;
  onConceptQuery: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onQueryRun,
  onTileHeatmapQuery,
  onTileConceptQuery,
  onConceptHeatmapQuery,
  onConceptQuery,

}) => {
  const {
    selectedTile,
    setViewMagnification,
    setCurrentSlide,
    setSelectedTile,
    currentSlideID,
    heatmap,
    selectedConcept,
    currentSlideMetadata,
    setNormalizeHeatmap,
    normalizeHeatmap,
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
  const [samePatientQuery, setSamePatientQuery] = useState(
    samePatient === null ? "NA" : samePatient ? "same" : "other"
  );
  const [sameWsiQuery, setSameWsiQuery] = useState(
    sameWSI === null ? "NA" : sameWSI ? "same" : "other"
  );
  const [tagFilter, setTagFilterState] = useState("");
  const [tileSimilaritySearchVisible, setTileSimilaritySearchVisible] = useState(false);
  const [tileSimilarityHeatmapVisible, setTileSimilarityHeatmapVisible] = useState(false);
  const [fileBrowserVisible, setFileBrowserVisible] = useState(false);
  const [tileConceptVisible, setTileConceptVisible] = useState(false);
  const [conceptSimilarityVisible, setConceptSimilarityVisible] = useState(false);
  const [conceptHeatmapVisible, setConceptHeatmapVisible] = useState(false);

  useEffect(() => {
    if (currentSlideID !== sampleID && currentSlideID) {
      setSampleId(currentSlideID);
    }
  }, [currentSlideID]);

  const getButtonStyle = (disabled: boolean) => ({
    ...styles.button,
    ...(disabled ? styles.disabledButton : {}),
  });

  return (
    <div className="control-panel" style={styles.panel}>
      <div style={{ paddingBottom: "10px" }}>
        <div style={styles.sampleSearchRow}>
          <label style={styles.sampleLabel}>
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
          <button
            style={styles.searchButton}
            onClick={() => {
              if (sampleID !== currentSlideID) {
                setCurrentSlide(sampleID);
                setShowHeatmap(false);
              }
            }}
          >
            🔍
          </button>
        </div>

        <Dropdown
          label="Tile Magnification:"
          value={tileOption}
          options={["NA", "5x", "10x", "20x"]}
          onChange={(value) => {
            setTileOption(value);
            setViewMagnification(toTileMagnification(value));
          }}
        />
        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "10px 0" }}>Tools:</h2>
      </div>

      <div style={styles.scrollableSection}>
        <Section
          title="File Browser"
          expanded={fileBrowserVisible}
          onToggle={() => setFileBrowserVisible(!fileBrowserVisible)}
        >
          <FileBrowser />
        </Section>

        <Section
          title="Tile Similarity Search"
          expanded={tileSimilaritySearchVisible}
          onToggle={() => setTileSimilaritySearchVisible(!tileSimilaritySearchVisible)}
        >
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
            onChange={(value) =>
              setStainList(value !== "NA" ? [value as Stains] : null)
            }
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
          <button
            disabled={selectedTile == null}
            onClick={onQueryRun}
            style={getButtonStyle(selectedTile == null)}
          >
            SEARCH
          </button>
        </Section>

        <Section
          title="Tile Similarity Heatmap"
          expanded={tileSimilarityHeatmapVisible}
          onToggle={() => setTileSimilarityHeatmapVisible(!tileSimilarityHeatmapVisible)}
        >
          <Dropdown
            label="Tile Magnification:"
            value={magnification == null ? "NA" : magnification}
            options={["NA", "5x", "10x", "20x"]}
            onChange={(value) =>
              setMagnification(value !== "NA" ? (value as TileMagnification) : null)
            }
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
          <label>
            Normalize Heatmap:
            <input
              type="checkbox"
              checked={normalizeHeatmap}
              onChange={(e) => setNormalizeHeatmap?.(e.target.checked)}
              disabled={heatmap == null}
            />
          </label>
          <br /><br />
          <button
            disabled={selectedTile == null}
            onClick={onTileHeatmapQuery}
            style={getButtonStyle(selectedTile == null)}
          >
            Generate Heatmap
          </button>
        </Section>

        <Section
          title="Tile Concept Query"
          expanded={tileConceptVisible}
          onToggle={() => setTileConceptVisible(!tileConceptVisible)}
        >
          {!selectedTile ? (
            <div style={{ color: "red" }}>Please select a tile.</div>
          ) : (
            <div>Selected tile: {selectedTile.uuid}</div>
          )}
          <button
            disabled={selectedTile == null}
            onClick={onTileConceptQuery}
            style={getButtonStyle(selectedTile == null)}
          >
            SEARCH
          </button>
        </Section>

        <Section
          title="Concept Similarity Search"
          expanded={conceptSimilarityVisible}
          onToggle={() => setConceptSimilarityVisible(!conceptSimilarityVisible)}
        >
          <ConceptBrowser />
          <br />
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
          <button
            disabled={selectedConcept == null}
            onClick={onConceptQuery}
            style={getButtonStyle(selectedConcept == null)}
          >
            SEARCH
          </button>
        </Section>

        <Section
          title="Concept Similarity Heatmap"
          expanded={conceptHeatmapVisible}
          onToggle={() => setConceptHeatmapVisible(!conceptHeatmapVisible)}
        >
          <ConceptBrowser />
          <br />
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
          <label>
            Normalize Heatmap:
            <input
              type="checkbox"
              checked={normalizeHeatmap}
              onChange={(e) => setNormalizeHeatmap?.(e.target.checked)}
              disabled={heatmap == null}
            />
          </label>
          <br /><br />
          <button
            disabled={selectedConcept == null || currentSlideMetadata == null}
            onClick={onConceptHeatmapQuery}
            style={getButtonStyle(selectedConcept == null || currentSlideMetadata == null)}
          >
            Generate Heatmap
          </button>
        </Section>
      </div>
    </div>
  );
};

const Dropdown: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => (
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

const Section: React.FC<{
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}> = ({ title, expanded, onToggle, children }) => (
  <div style={styles.section}>
    <div onClick={onToggle} style={styles.sectionHeader}>
    {expanded ? "▼" : "▶"} <strong>{title}</strong> 
    </div>
    {expanded && <div style={styles.sectionContent}>{children}</div>}
    <div style={styles.divider} />
  </div>
);

const styles = {
  panel: {
    padding: "10px",
    borderRight: "1px solid #ccc",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
  },
  sampleSearchRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
  },
  sampleLabel: {
    marginRight: "10px",
  },
  input: {
    marginLeft: "10px",
    padding: "5px",
    width: "150px",
  },
  searchButton: {
    marginLeft: "10px",
    padding: "5px 10px",
    cursor: "pointer",
  },
  select: {
    marginLeft: "10px",
    padding: "5px",
  },
  button: {
    padding: "8px 12px",
    marginTop: "5px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  section: {
    marginBottom: "10px",
  },
  sectionHeader: {
    cursor: "pointer",
    fontSize: "16px",
    padding: "8px 0",
    userSelect: "none",
  },
  sectionContent: {
    marginTop: "8px",
    paddingLeft: "10px",
  },
  divider: {
    borderBottom: "1px solid #ddd",
    marginTop: "10px",
  },
  scrollableSection: {
    overflowY: "auto",
    paddingRight: "5px",
    flex: 1,
  },
};

export default ControlPanel;
