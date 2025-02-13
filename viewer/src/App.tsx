import { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  getPanelElement,
  getPanelGroupElement,
  getResizeHandleElement,
} from "react-resizable-panels";
import WSIViewer from "./components/WSIViewer";
import ControlPanel from "./components/ControlPanel";
import QueryResults from "./components/QueryResults";
import { Tile, TileMagnification } from "./types";

const App = () => {
  const [tileMagnification, setTileMagnification] = useState<TileMagnification | null>(null);
  const [sampleID, setSampleID] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [queryTile, setQueryTile] = useState<Tile | null>(null);
  const [queryResults, setQueryResults] = useState<Tile[] | null>(null);
  const refs = useRef<any>(null);
  
  const querySimilarTiles = async () => {
    if (!selectedTile) return; // Ensure queryTile is not null before running query
    try {
      setQueryTile(selectedTile);
      const response = await fetch(
        `http://localhost:8000/query_similar_tiles/?tile_uuid=${selectedTile.uuid}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch similar tiles");
      }
      const result = await response.json();
      console.log("Query for ", selectedTile.uuid);
      console.log("Query result:", result);
      setQueryResults(result);
    } catch (error) {
      console.error("Error querying similar tiles:", error);
      setQueryResults(null);
    }
  };

  useEffect(() => {
    if (!sampleID) return;

    console.log("We have a new sample ID: ", sampleID);

    const loadWSI = async () => {
      const response = await fetch(`http://localhost:8000/load_wsi/?sample_id=${sampleID}`);
      const result = await response.json();
      console.log("RESULT OF THE LOADING: ", result);
    };
    loadWSI();
  }, [sampleID]);

  useEffect(() => {
    const groupElement = getPanelGroupElement("group");
    const leftPanelElement = getPanelElement("left-panel");
    const rightPanelElement = getPanelElement("right-panel");
    const resizeHandleElement = getResizeHandleElement("resize-handle");

    refs.current = {
      groupElement,
      leftPanelElement,
      rightPanelElement,
      resizeHandleElement,
    };
  }, []);

  return (
    <div className="h-screen w-screen flex">
      <PanelGroup direction="horizontal" className="flex-1 h-full">
        <Panel defaultSize={20} minSize={20} className="h-full">
          <ControlPanel 
            onSampleIdChange={setSampleID}
            onQueryRun={querySimilarTiles}
            onTileMagnificationChange={setTileMagnification}
          />
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel minSize={30} className="h-full flex-1">
          {sampleID ? (
            <WSIViewer 
              tileMagnification={tileMagnification} 
              sampleID={sampleID}
              onSelectedTileChange={setSelectedTile}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Please search for a sample to display the viewer.
            </div>
          )}
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel 
          defaultSize={queryResults && selectedTile ? 20 : 0} 
          minSize={queryResults && selectedTile ? 20 : 0} 
          className="h-full" 
          hidden={!queryResults || !queryTile}
        >
          {queryResults && queryTile && (
            <QueryResults queryTile={queryTile} resultTiles={queryResults} />
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
