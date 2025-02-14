import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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

  const querySimilarTiles = async () => {
    if (!selectedTile) return;
    try {
      setQueryTile(selectedTile);
      const response = await fetch(`http://localhost:8000/query_similar_tiles/?tile_uuid=${selectedTile.uuid}`);
      if (!response.ok) throw new Error("Failed to fetch similar tiles");
      setQueryResults(await response.json());
    } catch (error) {
      console.error("Error querying similar tiles:", error);
      setQueryResults(null);
    }
  };

  useEffect(() => {
    if (!sampleID) return;
    fetch(`http://localhost:8000/load_wsi/?sample_id=${sampleID}`).then((res) => res.json());
  }, [sampleID]);

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
          defaultSize={queryResults && selectedTile ? 30 : 0} 
          minSize={queryResults && selectedTile ? 25 : 0} 
          className="h-full" 
          hidden={!queryResults || !queryTile}
        >
          {queryResults && queryTile && <QueryResults queryTile={queryTile} resultTiles={queryResults} />}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
