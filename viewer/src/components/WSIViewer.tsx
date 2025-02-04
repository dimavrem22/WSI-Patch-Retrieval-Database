import { useState, useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileGrid from "ol/tilegrid/TileGrid";
import { defaults as defaultControls } from "ol/control";
import { SlideMetadata } from "../types"; // Ensure this is the correct path

const metadata: SlideMetadata = {
  level_count: 17,
  level_dimentions: [
    [1, 1],
    [2, 2],
    [3, 3],
    [5, 5],
    [9, 10],
    [18, 19],
    [36, 38],
    [71, 76],
    [141, 151],
    [281, 301],
    [561, 602],
    [1121, 1203],
    [2241, 2406],
    [4482, 4811],
    [8964, 9622],
    [17928, 19244],
    [35856, 38487],
  ],
  extent: [0, 0, 35856, 38487], // Adjusted to fit tile grid
  level_tiles: [
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [2, 2],
    [3, 3],
    [5, 5],
    [9, 10],
    [18, 19],
    [36, 38],
    [71, 76],
    [141, 151],
  ],
  startZoom: 10,
  minZoom: 8,
  maxZoom: 17,
  mpp_x: 0.2457,
  mpp_y: 0.2457,
  resolutions: [
    65536, 32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1,
  ],
};

const WSIViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

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
  }, []);

  return <div ref={mapRef} className="wsi-viewer" />;
};

export default WSIViewer;
