import { create } from 'zustand';
import { TileMagnification, Stains } from '../types';


interface QueryParameters {
    maxHits: number;
    minSimilarity: number;
    magnificationList: TileMagnification[] | null;
    stainList: Stains[] | null;
    samePatient: boolean | null;
    sameWSI: boolean | null;
    tagFilter: string | null;
  
    setMaxHits: (maxHits: number) => void;
    setMinSimilarity: (minSimilarity: number) => void;
    setMagnificationList: (magnificationList: TileMagnification[] | null) => void;
    setStainList: (stainList: Stains[] | null) => void;
    setSamePatient: (samePatient: boolean | null) => void;
    setSameWSI: (sameWSI: boolean | null) => void;
    setTagFilter: (tagFilter: string | null) => void;
  }
  
  export const useQueryStore = create<QueryParameters>((set) => ({
    maxHits: 100,
    minSimilarity: 0.75,
    magnificationList: null,
    stainList: null,
    samePatient: null,
    sameWSI: null,
    tagFilter: null,
  
    setMaxHits: (maxHits) => set({ maxHits }),
    setMinSimilarity: (minSimilarity) => set({ minSimilarity }),
    setMagnificationList: (magnificationList) => set({ magnificationList }),
    setStainList: (stainList) => set({ stainList }),
    setSamePatient: (samePatient) => set({ samePatient }),
    setSameWSI: (sameWSI) => set({ sameWSI }),
    setTagFilter: (tagFilter) => set({tagFilter: tagFilter? tagFilter.trim().toLowerCase() : tagFilter}),
  }));
  