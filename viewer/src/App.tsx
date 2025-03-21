import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import WSIViewer from "./components/WSIViewer";
import ControlPanel from "./components/ControlPanel";
import QueryResults from "./components/QueryResults";
import MetadataComponent from "./components/MetadataComponent";
import { useGlobalStore } from "./store/useGlobalStore";
import { useQueryStore } from "./store/useTileSearchStore";
import { useTileHeatmapParamsStore } from "./store/useTileHeatmapStore";
import LoadingSpinner from "./components/LoadingSpinner";
import FullScreenError from "./components/FullScreenError";
import { fetchWithTimeout } from "./utils/fetchWithTimeout";

const App = () => {
  const serverURL = import.meta.env.VITE_SERVER_URL;
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null); // null = loading, false = error, true = ready

  // 🧪 Check server availability on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        console.log("trying");
        const res = await fetchWithTimeout(`${serverURL}/`);
        if (!res.ok) throw new Error("Ping failed");
        const result = await res.json();
        if (result === true) setServerAvailable(true);
        else throw new Error("Unexpected ping response");
      } catch (err) {
        console.error("Server unavailable:", err);
        setServerAvailable(false);
      }
    };
    checkServer();
  }, [serverURL]);

  const {
    currentSlideID,
    selectedTile,
    setQueryTile,
    queryTile,
    queryResults,
    setQueryResults,
    setHeatmap,
    currentSlideMetadata,
    setCurrentSlideMetadata,
    setCurrentSlide,
  } = useGlobalStore();

  
  const { maxHits, minSimilarity, magnificationList, stainList, samePatient, sameWSI, tagFilter } = useQueryStore();
  const { setShowHeatmap } = useTileHeatmapParamsStore();

  // Dynamically track which tabs should be visible
  const availableTabs: string[] = [];
  if (currentSlideMetadata) availableTabs.push("metadata");
  if (queryResults) availableTabs.push("queryResults");

  // Track which tab is active
  const [activeTab, setActiveTab] = useState(availableTabs[0] || "");

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]); // Automatically set the first available tab
    }
  }, [availableTabs, activeTab]);


  // Update metadata when slide id changes
  useEffect(() => {
    if (!currentSlideID) return;
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${serverURL}/metadata/?sample_id=${encodeURIComponent(currentSlideID)}`);
        if (!response.ok) throw new Error("Failed to fetch metadata");
        setCurrentSlideMetadata(await response.json());
      } catch (error) {
        console.error("Error fetching metadata:", error);
        toast.error(`Invalid slide id: ${currentSlideID}`);
        setCurrentSlide(null);
        setCurrentSlideMetadata(null);
      }
    };
    fetchMetadata();
  }, [currentSlideID]);

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

      if (tagFilter) params.append("tag_filter", tagFilter.toString());
      if (samePatient !== null) params.append("same_pt", samePatient.toString());
      if (sameWSI !== null) params.append("same_wsi", sameWSI.toString());
      if (magnificationList && magnificationList.length > 0) magnificationList.forEach(m => params.append("magnification_list", m));
      if (stainList && stainList.length > 0) stainList.forEach(s => params.append("stain_list", s));

      console.log("Final query params:", params.toString());

      const response = await fetch(`${serverURL}/query_similar_tiles/?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch similar tiles");

      const data = await response.json();
      setQueryResults(data);
      setActiveTab("queryResults"); // Automatically switch to Query Results tab
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
    fetch(`${serverURL}/load_wsi/?sample_id=${encodeURIComponent(currentSlideID)}`)
      .then((res) => res.json());
  }, [currentSlideID]);

  return (
    <div className="h-screen w-screen flex">
      <Toaster />
      <PanelGroup direction="horizontal" className="flex-1 h-full">
        <Panel defaultSize={20} minSize={20} className="h-full">
          <ControlPanel 
            onQueryRun={querySimilarTiles}
            onTileHeatmapQuery={querySimilarTilesHeatmap}
          />
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel minSize={30} className="h-full flex-1">
          {serverAvailable === null ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Establishing server connection...
            </div>
          ) : serverAvailable ? (
            currentSlideID ? (
              currentSlideMetadata ? (
                <WSIViewer />
              ) : (
                <LoadingSpinner />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Please search for a sample to display in the viewer.
              </div>
            )
          ) : (
            <FullScreenError />
          )}
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        {availableTabs.length > 0 && (
          <Panel defaultSize={30} minSize={25} className="h-full">
            {/* Show tabs only if more than one tab exists */}
            {availableTabs.length > 1 && (
              <div className="flex border-b">
                {availableTabs.includes("metadata") && (
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === "metadata" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("metadata")}
                  >
                    Metadata
                  </button>
                )}
                {availableTabs.includes("queryResults") && (
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === "queryResults" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("queryResults")}
                  >
                    Query Results
                  </button>
                )}
              </div>
            )}

            {/* Tab Content */}
            <div className="p-2 h-full overflow-auto">
              {activeTab === "metadata" && currentSlideMetadata && (
                <MetadataComponent metadata={currentSlideMetadata} onMetadataChange={() => {}} />
              )}
              {activeTab === "queryResults" && queryTile && queryResults && (
                <QueryResults queryTile={queryTile} resultTiles={queryResults} />
              )}
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
};

export default App;
