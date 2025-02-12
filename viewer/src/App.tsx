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
import { TileMagnification } from "./types";

const App = () => {
  const [tileMagnification, setTileMagnification] = useState<TileMagnification | null>(null);
  const [sampleID, setSampleID] = useState<string | null>(null);
  const refs = useRef<any>(null);

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
            onQueryRun={() => {
              console.log("RUN QUEWRY");
            }}
            onTileMagnificationChange={setTileMagnification}
          />
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel minSize={30} className="h-full flex-1">
          {sampleID ? (
            <WSIViewer tileMagnification={tileMagnification} sampleID={sampleID}/>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Please search for a sample to display the viewer.
            </div>
          )}
        </Panel>
        <PanelResizeHandle className="resize-handle" />
        <Panel defaultSize={20} minSize={0} className="h-full">
          Right Panel
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
