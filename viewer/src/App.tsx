import { useState } from "react";
import WSIViewer from "./components/WSIViewer"
import ControlPanel from "./components/ControlPanel";


const App = () => {
  const [imagePath, setImagePath] = useState<string>("");
  const [tileSize, setTileSize] = useState<string>("none");

  return (
    <div>
      <ControlPanel onImagePathChange={setImagePath} onTileSizeChange={setTileSize} />
      <WSIViewer/>
    </div>
  );
};

export default App;
