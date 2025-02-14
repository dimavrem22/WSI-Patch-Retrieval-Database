import { useState, useEffect, useRef } from "react";
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
import { SlideMetadata, Tile, TileMagnification } from "../types";
import "ol/ol.css";

interface WSIViewerProps {
  onSelectedTileChange: (tile: Tile | null) => void;
  tileMagnification: TileMagnification | null;
  sampleID: string;
}

const WSIViewer: React.FC<WSIViewerProps> = ({ tileMagnification, sampleID, onSelectedTileChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef(new VectorSource());
  const lastHighlightedFeature = useRef<Feature<Geometry> | null>(null);
  const [metadata, setMetadata] = useState<SlideMetadata | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`http://localhost:8000/metadata/?sample_id=${sampleID}`);
        if (!response.ok) throw new Error("Failed to fetch metadata");
        setMetadata(await response.json());
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, [sampleID]);

  useEffect(() => {
    if (!mapRef.current || !metadata) return;

    const slideGrid = new TileGrid({
      extent: metadata.extent,
      tileSize: [256, 256],
      minZoom: metadata.minZoom,
      resolutions: metadata.resolutions,
    });

    const tileLayer = new TileLayer({
      source: new XYZ({
        url: `http://localhost:8000/tiles/{z}/{x}/{y}/?sample_id=${sampleID}`,
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
          metadata.extent[0] + (metadata.extent[2] - metadata.extent[0]) / 2,
          metadata.extent[1] + (metadata.extent[3] - metadata.extent[1]) / 2,
        ],
        zoom: metadata.startZoom,
        minZoom: metadata.minZoom,
        maxZoom: metadata.maxZoom,
        extent: metadata.extent,
      }),
    });

    mapInstance.on("singleclick", (event) => {
      const clickedCoords = event.coordinate;
      let selectedTile = null;

      vectorSourceRef.current.forEachFeature((feature) => {
        if (feature.getGeometry()?.intersectsCoordinate(clickedCoords)) {
          selectedTile = metadata.tiles.find((tile) => tile.uuid === feature.get("name"));
        }
      });

      onSelectedTileChange(selectedTile || null);
      highlightTile(selectedTile);
    });

    return () => mapInstance.setTarget(undefined);
  }, [metadata, sampleID]);

  useEffect(() => {
    if (!metadata || !vectorSourceRef.current) return;

    const vectorSource = vectorSourceRef.current;
    vectorSource.clear();

    metadata.tiles
      .filter((tile) => tile.magnification === tileMagnification)
      .forEach((tile) => {
        const x = metadata.extent[0] + tile.x;
        const y = metadata.extent[3] - tile.y - tile.size;
        const tileFeature = new Feature({
          geometry: new Polygon([[[x, y], [x + tile.size, y], [x + tile.size, y + tile.size], [x, y + tile.size], [x, y]]]),
          name: tile.uuid,
        });
        tileFeature.setStyle(new Style({ stroke: new Stroke({ color: "red", width: 2 }) }));
        vectorSource.addFeature(tileFeature);
      });
  }, [tileMagnification, metadata]);

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

  if (!metadata) return <div>Loading metadata...</div>;

  return <div className="map-container"><div ref={mapRef} className="wsi-viewer" /></div>;
};

export default WSIViewer;
