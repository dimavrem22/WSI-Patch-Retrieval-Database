import { useState, useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileGrid from "ol/tilegrid/TileGrid";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Polygon } from "ol/geom";
import { Style, Stroke } from "ol/style";
import { defaults as defaultControls} from "ol/control";
import { defaults as defaultInteractions} from "ol/interaction";
import MousePosition from "ol/control/MousePosition";
import { createStringXY } from "ol/coordinate";
import { SlideMetadata } from "../types";
import "ol/ol.css";

const WSIViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const [metadata, setMetadata] = useState<SlideMetadata | null>(null);
  const [coordinates, setCoordinates] = useState<string>("X: -, Y : -");

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
    if (!mapRef.current || !metadata || !coordRef.current) return;

    console.log(metadata);

    const scaleX = 1;
    const scaleY = 1;

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

    // Create Tile Layer
    const tileLayer = new TileLayer({
      source: tileSource,
    });

    // Generate Tile Outlines
    const vectorSource = new VectorSource();
    metadata.tiles.forEach((tile) => {
      const x = metadata.extent[0] + tile.x;
      const y = metadata.extent[3] - tile.y - tile.size;

      const sizeX = tile.size * scaleX;
      const sizeY = tile.size * scaleY;

      const tilePolygon = new Polygon([
        [
          [x, y],
          [x + sizeX, y],
          [x + sizeX, y + sizeY],
          [x, y + sizeY],
          [x, y],
        ],
      ]);

      const tileFeature = new Feature({
        geometry: tilePolygon,
      });

      tileFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: "red",
            width: 2,
          }),
        })
      );

      vectorSource.addFeature(tileFeature);
    });

    // Create Vector Layer for Tile Outlines
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    // Create MousePosition Control
    const mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(2),
      projection: "EPSG:3857",
      className: "mouse-position",
      target: coordRef.current,
    });

    // Handle Mouse Enter & Leave Events
    mapRef.current.addEventListener("pointermove", (event) => {
      const map = mapInstance.current;
      if (map) {
        const coords = map.getEventCoordinate(event);
        setCoordinates(`X: ${coords[0].toFixed(2)}, Y: ${coords[1].toFixed(2)}`);
      }
    });

    mapRef.current.addEventListener("mouseleave", () => {
      setCoordinates("X: -, Y : -");
    });

    // Create OpenLayers Map (Disable Double-Click Zoom)
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer],
      controls: defaultControls({ zoom: false, rotate: false }).extend([
        mousePositionControl,
      ]),
      interactions: defaultInteractions({ doubleClickZoom: false }),
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

  return (
    <div className="map-container">
      <div ref={mapRef} className="wsi-viewer" />
      <div ref={coordRef} className="mouse-coordinates">{coordinates}</div>
    </div>
  );
};

export default WSIViewer;
