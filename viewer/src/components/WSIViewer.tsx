import { useState, useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileGrid from "ol/tilegrid/TileGrid";
import { defaults as defaultControls } from "ol/control";
import { SlideMetadata } from "../types"; // Ensure this is the correct path

const WSIViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const [metadata, setMetadata] = useState<SlideMetadata | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch("http://localhost:8000/metadata/");
        if (!response.ok) {
          throw new Error("Failed to fetch metadata");
        }
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !metadata) return;

    // Tile Grid Setup
    const slideGrid = new TileGrid({
      extent: metadata.extent,
      tileSize: [256, 256],
      minZoom: metadata.minZoom,
      resolutions: metadata.resolutions,
    });

    // Tile Source Setup
    const tileSource = new XYZ({
      url: `http://localhost:8000/tiles/{z}/{x}/{y}`,
      crossOrigin: "anonymous",
      tileGrid: slideGrid,
    });

    // Create OpenLayers Map
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: tileSource,
        }),
      ],
      controls: defaultControls(),
      view: new View({
        projection: "EPSG:3857",
        center: [
          metadata.extent[0] + (metadata.extent[2] - metadata.extent[0]) / 2,
          metadata.extent[1] + (metadata.extent[3] - metadata.extent[1]) / 2,
        ],
        zoom: metadata.startZoom,
        minZoom: metadata.minZoom,
        maxZoom: metadata.maxZoom,
        extent: metadata.extent,
      }),
    });

    return () => {
      mapInstance.current?.setTarget(undefined);
    };
  }, [metadata]);

  if (!metadata) {
    return <div>Loading metadata...</div>;
  }

  return <div ref={mapRef} className="wsi-viewer" />;
};

export default WSIViewer;
