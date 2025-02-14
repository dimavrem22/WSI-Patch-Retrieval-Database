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
import "ol/ol.css";


const WSIViewer = () => {

  const {
    currentSlideID,
    setSelectedTile,
    currentSlideMetadata,
    setCurrentSlideMetadata,
    viewMagnification,
  } = useGlobalStore();

  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef(new VectorSource());
  const lastHighlightedFeature = useRef<Feature<Geometry> | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`http://localhost:8000/metadata/?sample_id=${currentSlideID}`);
        if (!response.ok) throw new Error("Failed to fetch metadata");
        setCurrentSlideMetadata(await response.json());
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, [currentSlideID]);

  useEffect(() => {
    if (!mapRef.current || !currentSlideMetadata) return;
  
    const slideGrid = new TileGrid({
      extent: currentSlideMetadata.extent,
      tileSize: [256, 256],
      minZoom: currentSlideMetadata.minZoom,
      resolutions: currentSlideMetadata.resolutions,
    });
  
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: `http://localhost:8000/tiles/{z}/{x}/{y}/?sample_id=${currentSlideID}`,
        crossOrigin: "anonymous",
        tileGrid: slideGrid,
      }),
    });
  
    const vectorLayer = new VectorLayer({ source: vectorSourceRef.current });
    const mapInstance = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer],
      controls: defaultControls({ zoom: false, rotate: false }),
      interactions: defaultInteractions({ doubleClickZoom: false }),
      view: new View({
        projection: "EPSG:3857",
        center: [
          currentSlideMetadata.extent[0] + (currentSlideMetadata.extent[2] - currentSlideMetadata.extent[0]) / 2,
          currentSlideMetadata.extent[1] + (currentSlideMetadata.extent[3] - currentSlideMetadata.extent[1]) / 2,
        ],
        zoom: currentSlideMetadata.startZoom,
        minZoom: currentSlideMetadata.minZoom,
        maxZoom: currentSlideMetadata.maxZoom,
        extent: currentSlideMetadata.extent,
      }),
    });
  
    // Handle tile selection
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
  
    // Cleanup function to remove the previous map instance
    return () => {
      mapInstance.setTarget(undefined);
      mapInstance.dispose();
    };
  }, [currentSlideMetadata]);
  

  useEffect(() => {
    if (!currentSlideMetadata || !vectorSourceRef.current) return;

    const vectorSource = vectorSourceRef.current;
    vectorSource.clear();

    currentSlideMetadata.tiles
      .filter((tile) => tile.magnification === viewMagnification)
      .forEach((tile) => {
        const x = currentSlideMetadata.extent[0] + tile.x;
        const y = currentSlideMetadata.extent[3] - tile.y - tile.size;
        const tileFeature = new Feature({
          geometry: new Polygon([[[x, y], [x + tile.size, y], [x + tile.size, y + tile.size], [x, y + tile.size], [x, y]]]),
          name: tile.uuid,
        });
        tileFeature.setStyle(new Style({ stroke: new Stroke({ color: "red", width: 2 }) }));
        vectorSource.addFeature(tileFeature);
      });
  }, [viewMagnification, currentSlideMetadata?.tiles]);

  const highlightTile = (tile: Tile | null) => {
    vectorSourceRef.current.forEachFeature((feature) => {
      feature.setStyle(new Style({ stroke: new Stroke({ color: "red", width: 2 }) }));
    });

    if (tile) {
      const selectedFeature = vectorSourceRef.current.getFeatures().find((f) => f.get("name") === tile.uuid);
      if (selectedFeature) {
        selectedFeature.setStyle(new Style({
          stroke: new Stroke({ color: "red", width: 2 }),
          fill: new Fill({ color: "hsla(60, 91.20%, 44.50%, 0.27)" }),
        }));
        lastHighlightedFeature.current = selectedFeature;
      }
    } else {
      lastHighlightedFeature.current = null;
    }
  };

  if (!currentSlideMetadata) return <div>Loading metadata...</div>;

  return <div className="map-container"><div ref={mapRef} className="wsi-viewer" /></div>;
};

export default WSIViewer;
