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

const ControlPanel: React.FC<ControlPanelProps> = (
  { onQueryRun, onTileHeatmapQuery, onTileConceptQuery, onConceptHeatmapQuery, onConceptQuery}
) => {
  const {
    selectedTile,
    setViewMagnification,
    setCurrentSlide,
    setSelectedTile,
    currentSlideID,
    heatmap,
    selectedConcept,
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
  const [fileBrowserVisible, setFileBrowserVisible] = useState(false);
  const [tileConceptVisible, setTileConceptVisible] = useState(false);
  const [conceptSimilarityVisible, setConceptSimilarityVisible] = useState(false);
  const [conceptHeatmapVisible, setConceptHeatmapVisible] = useState(false);


  useEffect(() => {
    if (currentSlideID !== sampleID && currentSlideID) {
      setSampleId(currentSlideID);
    }
  }, [currentSlideID]);
 
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
      <button onClick={() => {
        if (sampleID !== currentSlideID) {
          setCurrentSlide(sampleID);
          setShowHeatmap(false);
        }
        }
      }>🔍</button>
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
      <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "10px 0" }}>Tools:</h2>
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
        <button disabled={selectedTile == null} onClick={onQueryRun}>
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
          onChange={(value) => {
            setMagnification(value !== "NA" ? (value as TileMagnification) : null);
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

        <button disabled={selectedTile == null} onClick={onTileHeatmapQuery}>
          Generate Heatmap
        </button>
      </Section>
      <Section
        title="Tile Concept Query"
        expanded={tileConceptVisible}
        onToggle={() => setTileConceptVisible(!tileConceptVisible)}
      >

        {!selectedTile && (
          <div style={{ color: "red" }}>Please select a tile.</div>
        )}

        {selectedTile && (
          <div>Selected tile: {selectedTile.uuid}</div>
        )
        }
        
        <button disabled={selectedTile == null} onClick={onTileConceptQuery}>
          SEARCH
        </button>

      </Section>
      <Section
        title="Concept Similarity Search"
        expanded={conceptSimilarityVisible}
        onToggle={() => setConceptSimilarityVisible(!conceptSimilarityVisible)}
      >
        <ConceptBrowser/>
        <br/>
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
        <button disabled={selectedConcept == null} onClick={onConceptQuery}>
          SEARCH
        </button>
      </Section>
      <Section
        title="Concept Similarity Heatmap"
        expanded={conceptHeatmapVisible}
        onToggle={() => setConceptHeatmapVisible(!conceptHeatmapVisible)}
      >
          <ConceptBrowser/>
          <br></br>
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

        <button disabled={selectedConcept == null} onClick={onConceptHeatmapQuery}>
          Generate Heatmap
        </button>
      </Section>
      </div>
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

const Section: React.FC<{ title: string; expanded: boolean; onToggle: () => void; children?: React.ReactNode }> = ({
  title,
  expanded,
  onToggle,
  children,
}) => (
  <div style={styles.section}>
    <button onClick={onToggle} style={styles.fullWidthButton}>
      {title} {expanded ? "▼" : "▶"}
    </button>
    {expanded && <div style={styles.sectionContent}>{children}</div>}
  </div>
);

const styles = {
  panel: {
    padding: "10px",
    border: "1px solid #ccc",
    maxHeight: "99vh",
    // overflowY: "auto",
  },
  input: {
    marginLeft: "10px",
    padding: "5px",
    width: "150px",
  },
  select: {
    marginLeft: "10px",
    padding: "5px",
  },
  fullWidthButton: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    background: "#f0f0f0",
    border: "1px solid #bbb",
    textAlign: "left",
  },
  section: {
    border: "2px solid #999",
    borderRadius: "5px",
    padding: "10px",
    marginBottom: "15px",
    backgroundColor: "#fafafa",
  },
  sectionContent: {
    marginTop: "10px",
  },
  scrollableSection: {
    maxHeight: "calc(99vh - 250px)", // Adjust as needed depending on your top section height
    overflowY: "auto",
    paddingRight: "5px", // optional: for space between scrollbar and content
  },
};


export default ControlPanel;
