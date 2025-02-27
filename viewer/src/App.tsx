import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import WSIViewer from "./components/WSIViewer";
import ControlPanel from "./components/ControlPanel";
import QueryResults from "./components/QueryResults";
import { useGlobalStore } from "./store/useGlobalStore";
import { useQueryStore } from "./store/useTileSearchStore";
import { useTileHeatmapParamsStore } from "./store/useTileHeatmapStore";

const App = () => {

  const serverURL = import.meta.env.VITE_SERVER_URL

  const {
    currentSlideID,
    selectedTile,
    setQueryTile,
    queryTile,
    queryResults,
    setQueryResults,
    setHeatmap,
  } = useGlobalStore();

  const {
    maxHits,
    minSimilarity,
    magnificationList,
    stainList,
    samePatient,
    sameWSI,
    tagFilter,
  } = useQueryStore();

  const {
    setShowHeatmap
  } = useTileHeatmapParamsStore();


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

        if (tagFilter) {
          params.append("tag_filter", tagFilter.toString());
        }

        if (samePatient !== null) params.append("same_pt", samePatient.toString());
        if (sameWSI !== null) params.append("same_wsi", sameWSI.toString());

        if (magnificationList && magnificationList.length > 0) {
            magnificationList.forEach(m => params.append("magnification_list", m));
        }

        if (stainList && stainList.length > 0) {
            stainList.forEach(s => params.append("stain_list", s));
        }

        console.log("Final query params:", params.toString());

        const response = await fetch(`${serverURL}/query_similar_tiles/?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch similar tiles");

        const data = await response.json();
        setQueryResults(data);
    } catch (error) {
        console.error("Error querying similar tiles:", error);
        setQueryResults(null);
    }
};


const querySimilarTilesHeatmap = async () => {
  if (!selectedTile) return;

  try {
    setShowHeatmap(false);
    setHeatmap(null);
    console.log("Running heatmap for tile:", selectedTile.uuid);

    const params = new URLSearchParams();
    params.append("tile_uuid", selectedTile.uuid);
    console.log("Final query params:", params.toString());

    const response = await fetch(`${serverURL}/similar_tiles_heatmap/?${params.toString()}`);
          if (!response.ok) throw new Error("Failed to fetch heatmap tiles");

          const data = await response.json();
          setHeatmap(data);
          setShowHeatmap(true);
    } catch (error) {
        console.error("Error querying similar tiles:", error);
        setHeatmap(null);
        setShowHeatmap(false);
    }
};

  useEffect(() => {
    if (!currentSlideID) return;
    fetch(`${serverURL}/load_wsi/?sample_id=${currentSlideID}`).then((res) => res.json());
  }, [currentSlideID]);

  return (
    <div className="h-screen w-screen flex">
      <PanelGroup direction="horizontal" className="flex-1 h-full">
        <Panel defaultSize={20} minSize={20} className="h-full">
          <ControlPanel 
          onQueryRun={querySimilarTiles}
          onTileHeatmapQuery={querySimilarTilesHeatmap}
          />
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel minSize={30} className="h-full flex-1">
          {currentSlideID ? (
            <WSIViewer/>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Please search for a sample to display in the viewer.
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
