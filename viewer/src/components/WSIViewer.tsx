import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileGrid from "ol/tilegrid/TileGrid";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
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
    setCurrentSlideMetadata,
    viewMagnification,
    heatmap,
  } = useGlobalStore();

  const {
    showHeatmap,
  } = useTileHeatmapParamsStore();

  const tileStyle = new Style({ stroke: new Stroke({ color: "red", width: 2 }) });
  const highlightStyle = new Style({
    stroke: new Stroke({ color: "red", width: 2 }),
    fill: new Fill({ color: "hsla(60, 91.20%, 44.50%, 0.27)" }),
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef(new VectorSource());
  const lastHighlightedFeature = useRef<Feature<Geometry> | null>(null);

  useEffect(() => {
    if (!currentSlideID) return;
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${serverURL}/metadata/?sample_id=${encodeURIComponent(currentSlideID)}`);
        if (!response.ok) throw new Error("Failed to fetch metadata");
        setCurrentSlideMetadata(await response.json());
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, [currentSlideID]);

  useEffect(() => {
    if (!mapRef.current || !currentSlideMetadata || !currentSlideID) return;

    const slideGrid = new TileGrid({
      extent: currentSlideMetadata.extent,
      tileSize: [256, 256],
      minZoom: currentSlideMetadata.minZoom - 2,
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
    let zoom = currentSlideMetadata.minZoom;
    if (selectedTile) {
      center = [
        selectedTile.x + selectedTile.size / 2,
        currentSlideMetadata.extent[3] - selectedTile.y - selectedTile.size / 2,
      ];
      zoom = currentSlideMetadata.maxZoom - 2;
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
      maxZoom: currentSlideMetadata.maxZoom + 2,
      constrainResolution: false,
      extent: extent,
    });
    
    const mapInstance = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer],
      controls: defaultControls({ zoom: false, rotate: false }),
      interactions: defaultInteractions({ doubleClickZoom: false }),
      view: view,
    });
    
    // Fit the view to ensure the entire WSI is visible at startup
    view.fit(currentSlideMetadata.extent, {
      size: mapInstance.getSize(),
      padding: [50, 50, 50, 50], // Optional padding
    });

    mapInstance.on("singleclick", (event) => {
      const clickedCoords = event.coordinate;
      let selectedTile = null;

      vectorSourceRef.current.forEachFeature((feature) => {
        if (feature.getGeometry()?.intersectsCoordinate(clickedCoords)) {
          selectedTile = currentSlideMetadata.tiles.find((tile) => tile.uuid === feature.get("name"));
        }
      });

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
      console.log(heatmap);
      const features = heatmap.map((tile) => {
        const x = currentSlideMetadata.extent[0] + tile.x;
        const y = currentSlideMetadata.extent[3] - tile.y - tile.size;
      
        // Convert score (0 to 1) into an HSL hue (240 = blue, 0 = red)
        const hue = 240 * (1 - (tile.score+1)/2);  // 1 -> 0 (red), 0 -> 240 (blue)
        const fillColor = `hsla(${hue}, 100%, 50%, 0.5)`;  // 50% lightness, 50% transparency
      
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
      
      console.log(features);
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
  }, [viewMagnification, currentSlideMetadata, selectedTile, showHeatmap]);

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

  if (!currentSlideMetadata) return <div>Loading metadata...</div>

  return <div className="map-container"><div ref={mapRef} className="wsi-viewer" /></div>;
};

export default WSIViewer;