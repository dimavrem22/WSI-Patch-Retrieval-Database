import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileGrid from "ol/tilegrid/TileGrid";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MousePosition from 'ol/control/MousePosition.js';
import { Feature } from "ol";
import { Polygon, Geometry } from "ol/geom";
import { Style, Stroke, Fill } from "ol/style";
import { defaults as defaultControls } from "ol/control";
import { defaults as defaultInteractions } from "ol/interaction";
import { Tile } from "../types";
import { useGlobalStore } from "../store/useGlobalStore";
import { useTileHeatmapParamsStore } from "../store/useTileHeatmapStore";
import "ol/ol.css";


const WSIViewer = () => {

  const serverURL = import.meta.env.VITE_SERVER_URL

  const {
    currentSlideID,
    selectedTile,
    setSelectedTile,
    currentSlideMetadata,
    viewMagnification,
    heatmap,
    normalizeHeatmap
  } = useGlobalStore();

  const {
    showHeatmap,
  } = useTileHeatmapParamsStore();

  const tileStyle = new Style({ stroke: new Stroke({ color: "red", width: 2 }) });
  const highlightStyle = new Style({
    stroke: new Stroke({ color: "red", width: 2 }),
    fill: new Fill({ color: "hsla(60, 91.20%, 44.50%, 0.27)" }),
  });

  const mapInstanceRef = useRef<Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef(new VectorSource());
  const lastHighlightedFeature = useRef<Feature<Geometry> | null>(null);

  useEffect(() => {
    if (!mapRef.current || !currentSlideMetadata || !currentSlideID) return;

    const slideGrid = new TileGrid({
      extent: currentSlideMetadata.extent,
      tileSize: [256, 256],
      minZoom: 0,
      resolutions: currentSlideMetadata.resolutions,
    });

    const tileLayer = new TileLayer({
      source: new XYZ({
        url: `${serverURL}/tiles/{z}/{x}/{y}/?sample_id=${encodeURIComponent(currentSlideID)}`,
        crossOrigin: "anonymous",
        tileGrid: slideGrid,
      }),
    });

    const vectorLayer = new VectorLayer({ source: vectorSourceRef.current });

    let center = [
      currentSlideMetadata.extent[0] + (currentSlideMetadata.extent[2] - currentSlideMetadata.extent[0]) / 2,
      currentSlideMetadata.extent[1] + (currentSlideMetadata.extent[3] - currentSlideMetadata.extent[1]) / 2,
    ];
    let zoom = 0;


    if (selectedTile) {
      center = [
        selectedTile.x + selectedTile.size / 2,
        currentSlideMetadata.extent[3] - selectedTile.y - selectedTile.size / 2,
      ];
      zoom = currentSlideMetadata.level_count - 2;
    }


    const maxDim = Math.max(currentSlideMetadata.extent[3], currentSlideMetadata.extent[2]);
    const extent = [
      center[0] - 1 * maxDim,
      center[1] - 1 * maxDim,
      center[0] + 1 * maxDim,
      center[1] + 1 * maxDim,
    ];
    
    const view = new View({
      projection: "EPSG:3857",
      center: center,
      zoom: zoom,
      minZoom: 0,
      maxZoom: currentSlideMetadata.level_count + 1,
      constrainResolution: false,
      extent: extent,
    });


    const mousePositionControl = new MousePosition({
      className: "custom-mouse-position",
      coordinateFormat: function(coord: [number, number]) {
        const flippedY = currentSlideMetadata.extent[3] - coord[1]; // Flip the y-coordinate
        const roundedX = Math.round(coord[0]);
        const roundedY = Math.round(flippedY);
        const mousePositionText = `[${roundedX}, ${roundedY}]`; // Format as a string and return rounded coordinates
        const mousePositionBadge = document.querySelector('.mouse-position .badge');
        if (mousePositionBadge) {
          mousePositionBadge.innerText = mousePositionText; // Update the text inside the Badge
        }
        return mousePositionText;
      },
      projection: "EPSG:3857",
      undefinedHTML: '&nbsp;'
    });
    
    const mapInstance = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer],
      controls: defaultControls({ zoom: false, rotate: false }).extend([mousePositionControl]),
      interactions: defaultInteractions({ doubleClickZoom: false }),
      view: view,
    });
    mapInstanceRef.current = mapInstance;

    mapInstance.on("singleclick", (event) => {
      const clickedCoords = event.coordinate;
      let selectedTile = null;

      vectorSourceRef.current.forEachFeature((feature) => {
        if (feature.getGeometry()?.intersectsCoordinate(clickedCoords)) {
          selectedTile = currentSlideMetadata.tiles.find((tile) => tile.uuid === feature.get("name"));
        }
      });
      console.log(selectedTile);
      setSelectedTile(selectedTile || null);
      highlightTile(selectedTile);
    });

    return () => {
      mapInstance.setTarget(undefined);
      mapInstance.dispose();
    };
  }, [currentSlideMetadata]);

  useEffect(() => {
    if (!currentSlideMetadata || !vectorSourceRef.current) return;

    const vectorSource = vectorSourceRef.current;
    vectorSource.clear();

    if (showHeatmap && heatmap) {
      let minScore = -1;
      let maxScore = 1;
  
      if (normalizeHeatmap) {
        const scores = heatmap.map((tile) => tile.score);
        minScore = Math.min(...scores);
        maxScore = Math.max(...scores);
      }
  
      const getNormalizedScore = (score: number): number => {
        if (!normalizeHeatmap) return score;
        if (maxScore === minScore) return 0;
        return ((score - minScore) / (maxScore - minScore)) * 2 - 1; // normalize to [-1, 1]
      };
  
      const features = heatmap.map((tile) => {
        const x = currentSlideMetadata.extent[0] + tile.x;
        const y = currentSlideMetadata.extent[3] - tile.y - tile.size;
  
        const normScore = getNormalizedScore(tile.score);
        const hue = 240 * (1 - (normScore + 1) / 2); // map [-1, 1] → [240, 0]
        const fillColor = `hsla(${hue}, 100%, 50%, 0.5)`;
      
        const feature = new Feature({
          geometry: new Polygon([[
            [x, y], [x + tile.size, y], 
            [x + tile.size, y + tile.size], [x, y + tile.size], [x, y]
          ]]),
          name: tile.uuid,
        });
      
        feature.setStyle(new Style({
          fill: new Fill({ color: fillColor }),
        }));
      
        return feature;
      });
      vectorSource.addFeatures(features);
      return;
    }

    const features = currentSlideMetadata.tiles
      .filter((tile) => tile.magnification === viewMagnification)
      .map((tile) => {
        const x = currentSlideMetadata.extent[0] + tile.x;
        const y = currentSlideMetadata.extent[3] - tile.y - tile.size;

        return new Feature({
          geometry: new Polygon([[[x, y], [x + tile.size, y], [x + tile.size, y + tile.size], [x, y + tile.size], [x, y]]]),
          name: tile.uuid,
          style: tileStyle,
        });
      });
      console.log(features);

    vectorSource.addFeatures(features);
    highlightTile(selectedTile);
  }, [viewMagnification, currentSlideMetadata, selectedTile, showHeatmap, normalizeHeatmap]);

  const highlightTile = (tile: Tile | null) => {
    vectorSourceRef.current.forEachFeature((feature) => {
      feature.setStyle(tileStyle);
    });

    if (tile) {
      const selectedFeature = vectorSourceRef.current.getFeatures().find((f) => f.get("name") === tile.uuid);
      if (selectedFeature) {
        selectedFeature.setStyle(highlightStyle);
        lastHighlightedFeature.current = selectedFeature;
      }
    } else {
      lastHighlightedFeature.current = null;
    }
  };

  useEffect(() => {
    if (!mapInstanceRef.current || !currentSlideMetadata || !currentSlideMetadata.mpp_x) return;
  
    const view = mapInstanceRef.current.getView();
  
    const updateScaleLine = () => {
      const resolution = view.getResolution();
      if (!resolution) return;
    
      const micronsPerPixel = currentSlideMetadata.mpp_x;
      const pixelsAvailable = 120; // Total available bar length in px
      const realWorldLength = micronsPerPixel * resolution * pixelsAvailable;
    
      // Helper: round to "nice" numbers (e.g., 1, 2, 5, 10, 20, 50, 100, etc.)
      const getNiceScale = (value) => {
        const exponent = Math.floor(Math.log10(value));
        const fraction = value / Math.pow(10, exponent);
    
        let niceFraction;
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    
        return niceFraction * Math.pow(10, exponent);
      };
    
      const niceScaleInMicrons = getNiceScale(realWorldLength);
    
      // Compute bar width based on the nice value
      const barWidthPx = niceScaleInMicrons / (micronsPerPixel * resolution);
    
      let displayValue, unit;
      if (niceScaleInMicrons >= 1000) {
        displayValue = Math.round((niceScaleInMicrons / 1000) * 100) / 100;
        unit = "mm";
      } else {
        displayValue = Math.round(niceScaleInMicrons * 10) / 10;
        unit = "µm";
      }
    
      // Update UI
      const scalelineValueElement = document.getElementById("scaleline-value");
      const scalelineBarElement = document.getElementById("scaleline-bar");
    
      if (scalelineValueElement && scalelineBarElement) {
        scalelineValueElement.innerText = `${displayValue} ${unit}`;
        scalelineBarElement.style.width = `${barWidthPx}px`;
      }
    };
  
    view.on("change:resolution", updateScaleLine);
    updateScaleLine(); // Initial call
  
  }, [currentSlideMetadata]);
  
  const scores = heatmap?.map((t) => t.score) ?? [];
  const minScore = !normalizeHeatmap ? -1 : Math.min(...scores);
  const maxScore = !normalizeHeatmap ? 1 : Math.max(...scores);
  
  if (!currentSlideMetadata) return <div>Loading metadata...</div>

  return (
    <div className="map-container">
      <div ref={mapRef} className="wsi-viewer">
        <div className="mouse-position">
          <span className="badge">&nbsp;</span>
        </div>
        <div className="scaleline-container">
          <div id="scaleline-value"></div>
          <div id="scaleline-bar"></div>
        </div>
        {showHeatmap && (
          <div className="colorbar-container">
            <div className="colorbar-labels">
              <span style={{ fontWeight: "bold" }}>{maxScore.toFixed(2)}</span>
            </div>
            <div className="colorbar-gradient" />
            <div className="colorbar-labels">
              <span style={{ fontWeight: "bold" }}>{minScore.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WSIViewer;
