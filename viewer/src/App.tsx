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

const App = () => {
  const [imagePath, setImagePath] = useState<string>("");
  const [tileSize, setTileSize] = useState<string>("none");
  const refs = useRef<any>(null);

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
    <div>
       <PanelGroup direction="horizontal">
      <Panel defaultSize={20} minSize={20}>
        Left Panel
      </Panel>
      <PanelResizeHandle className="resize-handle" />
      <Panel minSize={30}>
        <WSIViewer/>
      </Panel>
      <PanelResizeHandle className="resize-handle" />
      <Panel defaultSize={20} minSize={0}>
        Right Panel
      </Panel>
    </PanelGroup>
    </div>
   
  );
};

export default App;
