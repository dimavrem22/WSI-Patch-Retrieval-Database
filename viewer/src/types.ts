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
  };