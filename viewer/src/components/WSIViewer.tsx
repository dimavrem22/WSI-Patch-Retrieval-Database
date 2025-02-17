import { useEffect, useRef, useState } from "react";
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
    selectedTile,
    setSelectedTile,
    currentSlideMetadata,
    setCurrentSlideMetadata,
    viewMagnification,
    center,
  } = useGlobalStore();

  const tileStyle = new Style({ stroke: new Stroke({ color: "red", width: 2 }) });
  const highlightStyle = new Style({
    stroke: new Stroke({ color: "red", width: 2 }),
    fill: new Fill({ color: "hsla(60, 91.20%, 44.50%, 0.27)" }),
  });

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
      minZoom: currentSlideMetadata.minZoom-2,
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

    // if a tile is selected, have it be the center and zoomed in
    let center = [
      currentSlideMetadata.extent[0] + (currentSlideMetadata.extent[2] - currentSlideMetadata.extent[0]) / 2,
      currentSlideMetadata.extent[1] + (currentSlideMetadata.extent[3] - currentSlideMetadata.extent[1]) / 2,
    ]
    let zoom = currentSlideMetadata.minZoom
    if (selectedTile) {
      center = [
        selectedTile.x + selectedTile.size / 2,
        currentSlideMetadata.extent[3] - selectedTile.y - selectedTile.size / 2
      ];
      zoom = currentSlideMetadata.maxZoom-2;
    }

    const mapInstance = new Map({
      target: mapRef.current,
      layers: [tileLayer, vectorLayer],
      controls: defaultControls({ zoom: false, rotate: false }),
      interactions: defaultInteractions({ doubleClickZoom: false }),
      view: new View({
        projection: "EPSG:3857",
        center: center,
        zoom: zoom,
        minZoom: currentSlideMetadata.minZoom-2,
        maxZoom: currentSlideMetadata.maxZoom+2,
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
  
    vectorSource.addFeatures(features);
    highlightTile(selectedTile);
  
  }, [viewMagnification, currentSlideMetadata, selectedTile])

  const highlightTile = (tile: Tile | null) => {

    // this rerenders the entire tile grid (prevents highlight of multiple tiles)
    vectorSourceRef.current.forEachFeature((feature) => {feature.setStyle(tileStyle);});

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


  

  if (!currentSlideMetadata) return <div>Loading metadata...</div>;

  return <div className="map-container"><div ref={mapRef} className="wsi-viewer" /></div>;
};

export default WSIViewer;
