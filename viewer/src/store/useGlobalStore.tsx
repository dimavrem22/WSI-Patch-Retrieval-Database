import { create } from 'zustand';
import { Tile, QueryForm, SlideMetadata, TileMagnification, Concept } from '../types';

interface GlobalState {
  currentSlideID: string | null;
  currentSlideMetadata: SlideMetadata | null;
  selectedTile: Tile | null;
  similarityQueryTile: Tile | null;
  conceptQueryTile: Tile | null;
  queryResults: Tile[] | null;
  queryControls: QueryForm;
  viewMagnification: TileMagnification | null;
  center: [number, number] | null;
  heatmap: Tile[] | null;
  normalizeHeatmap: boolean;
  conceptsQueryResults: Concept[] | null;
  allConcepts: Concept[] | null;
  selectedConcept: Concept | null;
  queryTarget: Concept | Tile | null;


  setCurrentSlide: (slide: string | null) => void;
  setCurrentSlideMetadata: (slideMetadata: SlideMetadata | null) => void;
  setSelectedTile: (tile: Tile | null) => void;
  setSimilarityQueryTile: (tile: Tile | null) => void;
  setConceptQueryTile: (tile: Tile | null) => void;
  setQueryResults: (results: Tile[] | null) => void;
  setQueryControls: (controls: QueryForm) => void;
  setViewMagnification: (magnification: TileMagnification | null) => void;
  setCenter: (center: [number, number] | null) => void;
  setHeatmap: (heatmap: Tile[] | null) => void;
  setNormalizeHeatmap: (normalizeHeatmap: boolean) => void;
  setConceptsQueryResults: (concepts: Concept[] | null) => void;
  setSelectedConcept: (concept: Concept | null) => void;
  setAllConcepts:  (concepts: Concept[] | null) => void;
  setQueryTarget: (target: Concept | Tile | null) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  currentSlideID: null,
  currentSlideMetadata: null,
  selectedTile: null,
  similarityQueryTile: null,
  conceptQueryTile: null,
  queryResults: null,
  viewMagnification: null,
  center: null,
  heatmap: null,
  normalizeHeatmap: false,
  conceptsQueryResults: null,
  selectedConcept: null,
  allConcepts: null,
  queryTarget: null,

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

  setCurrentSlide: (slideID) =>
    set({
      currentSlideID: slideID ? slideID.trim() : null,
      currentSlideMetadata: null,
      heatmap: null,
    }),

  setCurrentSlideMetadata: (slideMetadata) => set({ currentSlideMetadata: slideMetadata }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
  setSimilarityQueryTile: (tile) => set({ similarityQueryTile: tile }),
  setConceptQueryTile: (tile) => set({ conceptQueryTile: tile }),
  setQueryResults: (results) => set({ queryResults: results }),
  setQueryControls: (controls) => set({ queryControls: controls }),
  setViewMagnification: (magnification) => set({ viewMagnification: magnification }),
  setCenter: (center) => set({ center }),
  setHeatmap: (heatmap) => set({ heatmap }),
  setNormalizeHeatmap: (normalizeHeatmap) => set({normalizeHeatmap: normalizeHeatmap}),
  setConceptsQueryResults: (concepts) => set({ conceptsQueryResults: concepts }),
  setSelectedConcept: (concept) => set({ selectedConcept: concept }),
  setAllConcepts: (concepts) => set({ allConcepts: concepts }),
  setQueryTarget: (target) => set({queryTarget: target})
}));
