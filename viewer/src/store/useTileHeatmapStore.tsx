import { create } from 'zustand';
import { TileMagnification } from '../types';

interface QueryParameters {

    showHeatmap: boolean;
    setShowHeatmap: (showHeatmap: boolean) => void;

    magnification: TileMagnification | null;
    setMagnification: (magnification: TileMagnification | null) => void;

    mapOpacity: number;
    setMapopacity: (mapOpacity: number) => void;

}

export const useTileHeatmapParamsStore = create<QueryParameters>((set) => ({
  magnification: null,
  setMagnification: (magnification) => set({ magnification }),

  mapOpacity: 0.5,
  setMapopacity: (mapOpacity) => set({ mapOpacity }),

  showHeatmap: false,
  setShowHeatmap: (showHeatmap) => set({showHeatmap})

}));