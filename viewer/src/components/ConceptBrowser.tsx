import  { useState, useMemo, useRef, useEffect } from "react";
import { useGlobalStore } from "../store/useGlobalStore";

const ConceptBrowser = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    selectedConcept,
    setSelectedConcept,
    allConcepts,
  } = useGlobalStore();

  const concepts = allConcepts || [];

  useEffect(() => {
    if (selectedConcept) {
      setSearchTerm(selectedConcept.concept_name);
    }
  }, [selectedConcept]);

  const filteredConcepts = useMemo(() => {
    return concepts
      .filter((c) =>
        c.concept_name.toLowerCase().startsWith(searchTerm.toLowerCase().trim())
      )
      .sort((a, b) => a.concept_name.localeCompare(b.concept_name));
  }, [concepts, searchTerm]);

  const handleSelect = (concept: any) => {
    setSelectedConcept(concept);
    setSearchTerm(concept.concept_name);
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div style={styles.wrapper}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search concepts..."
        value={searchTerm}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 100)}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchBar}
        disabled={concepts.length === 0}
      />
      {focused && filteredConcepts.length > 0 && (
        <div style={styles.list}>
          {filteredConcepts.map((concept) => (
            <div
              key={concept.uuid}
              onClick={() => handleSelect(concept)}
              style={{
                ...styles.listItem,
                backgroundColor:
                  selectedConcept?.uuid === concept.uuid ? "#e0f2ff" : "white",
                fontWeight:
                  selectedConcept?.uuid === concept.uuid ? "bold" : "normal",
              }}
            >
              {concept.concept_name}
            </div>
          ))}
        </div>
      )}
      {focused && filteredConcepts.length === 0 && (
        <div style={styles.noMatch}>No matching concepts</div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: "relative" as const,
    width: "100%",
    maxHeight: "300px",
  },
  searchBar: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    borderRadius: "4px",
    boxSizing: "border-box" as const,
    color: "#000",
    fontStyle: "normal",
  },
  list: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "white",
    border: "1px solid #ccc",
    maxHeight: "200px",
    overflowY: "auto" as const,
    borderRadius: "0 0 4px 4px",
  },
  listItem: {
    padding: "8px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    color: "#000",
    fontStyle: "normal",
  },
  noMatch: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    padding: "10px",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    color: "#000",
    fontStyle: "normal",
  },
};

export default ConceptBrowser;
