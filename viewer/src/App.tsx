import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import WSIViewer from "./components/WSIViewer";
import ControlPanel from "./components/ControlPanel";
import QueryResults from "./components/QueryResults";
import { useGlobalStore } from "./store/useGlobalStore";

const App = () => {
  const {
    currentSlideID,
    selectedTile,
    setQueryTile,
    queryTile,
    queryResults,
    queryControls,
    setQueryResults,
    setQueryControls,
  } = useGlobalStore();

  const querySimilarTiles = async () => {
    if (!selectedTile) return;
    try {
      setQueryTile(selectedTile);
      setQueryResults([]);
      console.log("running query for: ", selectedTile.uuid)

      setQueryControls({ ...queryControls, tileUuid: selectedTile.uuid });
      const response = await fetch(`http://localhost:8000/query_similar_tiles/?tile_uuid=${selectedTile.uuid}`);
      if (!response.ok) throw new Error("Failed to fetch similar tiles");
      setQueryResults(await response.json());
    } catch (error) {
      console.error("Error querying similar tiles:", error);
      setQueryResults(null);
    }
  };

  useEffect(() => {
    if (!currentSlideID) return;
    fetch(`http://localhost:8000/load_wsi/?sample_id=${currentSlideID}`).then((res) => res.json());
  }, [currentSlideID]);

  return (
    <div className="h-screen w-screen flex">
      <PanelGroup direction="horizontal" className="flex-1 h-full">
        <Panel defaultSize={20} minSize={20} className="h-full">
          <ControlPanel onQueryRun={querySimilarTiles}/>
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel minSize={30} className="h-full flex-1">
          {currentSlideID ? (
            <WSIViewer/>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Please search for a sample to display the viewer.
            </div>
          )}
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel 
          defaultSize={queryResults !== null ? 30 : 0} 
          minSize={queryResults !== null ? 25 : 0} 
          className="h-full" 
          hidden={queryResults == null }
        >
          {queryResults !== null && queryTile && <QueryResults queryTile={queryTile} resultTiles={queryResults} />}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
