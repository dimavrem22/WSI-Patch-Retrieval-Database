export enum TileMagnification {
  LEVEL_1 = "5x",
  LEVEL_2 = "10x",
  LEVEL_3 = "20x",
};

export enum Stains {
  HE = "H&E",
  PAS = "PAS",
  TRI = "TRI",
  SIL = "SIL",
};

export enum Datasets {
  CMUH = "CMUH",
  KPMP = "KPMP",
  TCGA = "TCGA",
};

export const toTileMagnification = (value: string): TileMagnification => {
  const magnification = Object.values(TileMagnification).find(mag => mag === value);
  return magnification as TileMagnification || null;
};

export type Tile = {
  uuid: string;
  patient_id: string;
  stain: string;
  dataset: string;
  wsi_path: string;
  magnification: TileMagnification;
  x: number;
  y: number;
  size: number;
  score: number | null;
};

export type SlideMetadata = {
  level_count: number;
  level_dimentions: [number, number][];
  extent: [number, number, number, number];
  level_tiles: number[][];
  minZoom: number;
  startZoom: number;
  maxZoom: number;
  mpp_x: number;
  mpp_y: number;
  resolutions: number[];
  tiles: Tile[];
};

export type QueryForm = {

  // query tile 
  tileUuid: string;

  // search parameters
  maxSamples: number;
  minSimilarity: number;

  // wsi filters
  samePatient: boolean | null;
  sameWSI: boolean | null;
  datasets: Datasets[] | null;
  stains: Stains[] | null;

  // tile filters
  magnifications: TileMagnification[] | null;

};
