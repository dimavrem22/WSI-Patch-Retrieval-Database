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
import { Style, Stroke, Fill } from "ol/style";
import { defaults as defaultControls } from "ol/control";
import { defaults as defaultInteractions } from "ol/interaction";
import { SlideMetadata, TileMagnification } from "../types";
import "ol/ol.css";

interface WSIViewerProps {
  tileMagnification: TileMagnification | null;
  sampleID: string;
}

const WSIViewer: React.FC<WSIViewerProps> = ({ tileMagnification }) => {
  console.log("Tile Magnification:", tileMagnification);
  const mapRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const [metadata, setMetadata] = useState<SlideMetadata | null>(null);
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const lastHighlightedFeature = useRef<Feature<Polygon> | null>(null);

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

    // Create Vector Source for Tiles
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // Create Tiles as Features
    metadata.tiles.filter((tile) => {
      return tile.magnification == tileMagnification;
    }).forEach((tile, tileIndex) => {
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
        name: `Tile: ${tileIndex}`,
      });

      // Default Tile Style (Red Outline, No Fill)
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
    vectorLayerRef.current = vectorLayer;

    // Create OpenLayers Map (Disable Double-Click Zoom)
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer],
      controls: defaultControls({ zoom: false, rotate: false }).extend([
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

    // Click Event to Highlight Tile
    mapInstance.current.on("singleclick", (event) => {
      const clickedCoords = event.coordinate;
      console.log(`Clicked at: X: ${clickedCoords[0].toFixed(2)}, Y: ${clickedCoords[1].toFixed(2)}`);

      // Find the clicked tile
      let clickedFeature: Feature<Polygon> | null = null;
        vectorSource.forEachFeature((feature) => {
          if (feature.getGeometry()?.intersectsCoordinate(clickedCoords)) {
            clickedFeature = feature as Feature<Polygon>;
            console.log(clickedFeature);
            console.log('clicked tile name: ' + clickedFeature.get('name')); // Fix: Use get() method
            console.log("Clicked Feature Properties:", clickedFeature.getProperties()); // ✅ Logs all properties
console.log("Tile Name:", clickedFeature.get("name") || "Not Found!"); // ✅ Checks if it's undefined
          }
      });

      if (clickedFeature) {
        console.log("Tile clicked:", clickedFeature);

        // Remove previous highlights
        vectorSource.forEachFeature((feature) => {
          (feature as Feature<Polygon>).setStyle(
            new Style({
              stroke: new Stroke({
                color: "red",
                width: 2,
              }),
            })
          );
        });

        // Highlight clicked tile (Yellow Fill)
        (clickedFeature as Feature<Polygon>).setStyle(
          new Style({
            stroke: new Stroke({
              color: "red",
              width: 2,
            }),
            fill: new Fill({
              color: "hsla(60, 91.20%, 44.50%, 0.27)", // Light yellow with low opacity
            }),
          })
        );
        lastHighlightedFeature.current = clickedFeature; // Store the newly highlighted tile
      } else {
        // Unhighlight the previously selected tile if clicking on empty space
        if (lastHighlightedFeature.current) {
          lastHighlightedFeature.current.setStyle(
            new Style({
              stroke: new Stroke({ color: "red", width: 2 }), // Revert to default style
            })
          );
          lastHighlightedFeature.current = null; // Clear reference
        }
      
      }
    });

    return () => {
      mapInstance.current?.setTarget(undefined);
    };
  }, [metadata]);

  useEffect(() => {
    if (!metadata || !vectorSourceRef.current) return;

    console.log("Updating polygons for magnification:", tileMagnification);

    const vectorSource = vectorSourceRef.current;
    vectorSource.clear(); // Remove old polygons

    metadata.tiles
      .filter((tile) => tile.magnification === tileMagnification)
      .forEach((tile, tileIndex) => {
        const x = metadata.extent[0] + tile.x;
        const y = metadata.extent[3] - tile.y - tile.size;
        const sizeX = tile.size * 1;
        const sizeY = tile.size * 1;

        const tilePolygon = new Polygon([
          [
            [x, y],
            [x + sizeX, y],
            [x + sizeX, y + sizeY],
            [x, y + sizeY],
            [x, y],
          ],
        ]);

        const tileFeature = new Feature(
          { geometry: tilePolygon,
            name: `tile_${tileIndex}`,
          }
        );

        // Default Tile Style (Red Outline, No Fill)
        tileFeature.setStyle(
          new Style({
            stroke: new Stroke({ color: "red", width: 2 }),
          })
        );

        vectorSource.addFeature(tileFeature);
      });

    if (vectorLayerRef.current) {
      vectorLayerRef.current.setSource(vectorSource); // Reapply updated source
    }
  }, [tileMagnification, metadata]);

  if (!metadata) {
    return <div>Loading metadata...</div>;
  }

  return (
    <div className="map-container">
    <div ref={mapRef} className="wsi-viewer" />
    <div ref={coordRef} className="mouse-coordinates"></div> {/* Start empty to avoid whitespace issues */}
  </div>
  );
};

export default WSIViewer;
