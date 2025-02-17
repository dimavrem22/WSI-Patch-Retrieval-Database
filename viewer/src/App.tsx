import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import WSIViewer from "./components/WSIViewer";
import ControlPanel from "./components/ControlPanel";
import QueryResults from "./components/QueryResults";
import { useGlobalStore } from "./store/useGlobalStore";
import { useQueryStore } from "./store/useQueryStore";

const App = () => {
  const {
    currentSlideID,
    selectedTile,
    setQueryTile,
    queryTile,
    queryResults,
    setQueryResults,
  } = useGlobalStore();

  const {
    maxHits,
    minSimilarity,
    magnificationList,
    stainList,
    samePatient,
    sameWSI,
  } = useQueryStore();



  const querySimilarTiles = async () => {
    if (!selectedTile) return;
    try {
        setQueryTile(selectedTile);
        setQueryResults([]);
        console.log("Running query for tile:", selectedTile.uuid);

        const params = new URLSearchParams();
        params.append("tile_uuid", selectedTile.uuid);
        params.append("max_hits", maxHits.toString());
        params.append("min_score", minSimilarity.toString());

        if (samePatient !== null) params.append("same_pt", samePatient.toString());
        if (sameWSI !== null) params.append("same_wsi", sameWSI.toString());

        if (magnificationList && magnificationList.length > 0) {
            magnificationList.forEach(m => params.append("magnification_list", m));
        }

        if (stainList && stainList.length > 0) {
            stainList.forEach(s => params.append("stain_list", s));
        }

        console.log("Final query params:", params.toString());

        const response = await fetch(`http://localhost:8000/query_similar_tiles/?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch similar tiles");

        const data = await response.json();
        setQueryResults(data);
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
