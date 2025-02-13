
export enum TileMagnification {
    LEVEL_0 = "none",
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

export const toTileMagnification = (value: string): TileMagnification => {
    const magnification = Object.values(TileMagnification).find(mag => mag === value);
    return magnification as TileMagnification || TileMagnification.LEVEL_0;
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
    level_dimentions: [number, number][]; // Array of [width, height] pairs
    extent: [number, number, number, number]; // Single [width, height] pair
    level_tiles: number[][]; // Array of [tile_x, tile_y] pairs
    minZoom: number;
    startZoom: number;
    maxZoom: number;
    mpp_x: number;
    mpp_y: number;
    resolutions: number[]; // Array of zoom resolutions
    tiles: Tile[];
  };
