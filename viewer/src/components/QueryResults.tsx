import React from "react";
import TileComponent from "./TileComponent";
import { Tile } from "../types";

interface QueryResultsProps {
  queryTile: Tile;
  resultTiles: Tile[];
}

const QueryResults: React.FC<QueryResultsProps> = ({ queryTile, resultTiles }) => {
  return (
    <div className="query-results-container">
      <div className="query-image-wrapper">
        <TileComponent tile={queryTile} />
        <p className="hits-count">Hits: {resultTiles.length}</p>
      </div>
      <div className="tiles-container">
        {resultTiles.map((tile, tile_idx) => (
          <TileComponent key={tile_idx} tile={tile} />
        ))}
      </div>
    </div>
  );
};

export default QueryResults;
