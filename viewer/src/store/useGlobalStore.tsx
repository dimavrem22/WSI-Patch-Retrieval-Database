import { create } from 'zustand';
import { Tile, QueryForm, SlideMetadata, TileMagnification } from '../types';

interface GlobalState {
  currentSlideID: string | null;
  currentSlideMetadata: SlideMetadata | null;
  selectedTile: Tile | null;
  queryTile: Tile | null;
  queryResults: Tile[] | null;
  queryControls: QueryForm;
  viewMagnification: TileMagnification | null;
  center: [number, number] | null;
  heatmap: Tile[] | null;

  setCurrentSlide: (slide: string | null) => void;
  setCurrentSlideMetadata: (slideMetadata: SlideMetadata | null) => void;
  setSelectedTile: (tile: Tile | null) => void;
  setQueryTile: (queryTile: Tile | null) => void;
  setQueryResults: (results: Tile[] | null) => void;
  setQueryControls: (controls: QueryForm) => void;
  setViewMagnification: (magnification: TileMagnification | null) => void;
  setCenter: (center: [number, number] | null) => void;
  setHeatmap: (heatmap: Tile[] | null) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  currentSlideID: null,
  currentSlideMetadata: null,
  selectedTile: null,
  queryTile: null,
  queryResults: null,
  viewMagnification: null,
  queryControls: {
    tileUuid: "",
    maxSamples: 100,
    minSimilarity: 0.75,
    samePatient: null,
    sameWSI: null,
    datasets: null,
    stains: null,
    magnifications: null,
  },
  center: null,
  heatmap: null,

  setCurrentSlide: (slide) => set({ currentSlideID: slide }),
  setCurrentSlideMetadata: (slideMetadata) => set({ currentSlideMetadata: slideMetadata }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  setQueryTile: (tile) => set({ queryTile: tile }),
  setQueryResults: (results) => set({ queryResults: results }),
  setQueryControls: (controls) => set({ queryControls: controls }),
  setViewMagnification: (magnification) => set({ viewMagnification: magnification }),
  setCenter: (center) => set({ center: center }),
  setHeatmap: (heatmap) => set({ heatmap: heatmap }),
}));
