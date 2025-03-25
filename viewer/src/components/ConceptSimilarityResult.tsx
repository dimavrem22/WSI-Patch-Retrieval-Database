import React from "react";
import TileComponent from "./TileComponent";
import { Tile, Concept } from "../types";

interface ConceptSimilarityResultProps {
  queryConcept: Concept;
  resultTiles: Tile[];
}

const ConceptSimilarityResult: React.FC<ConceptSimilarityResultProps> = ({ queryConcept, resultTiles }) => {
  const uniquePatients = new Set(resultTiles.map(tile => tile.patient_id)).size;
  const totalResults = resultTiles.length;
  
  const stainDistribution = resultTiles.reduce((acc, tile) => {
    acc[tile.stain] = (acc[tile.stain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const magnificationDistribution = resultTiles.reduce((acc, tile) => {
    acc[tile.magnification] = (acc[tile.magnification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tagDistribution = resultTiles.reduce((acc, tile) => {
    tile.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const scores = resultTiles.map(tile => tile.score).filter(score => score !== undefined) as number[];
  const maxScore = scores.length > 0 ? Math.max(...scores).toFixed(3) : "N/A";
  const minScore = scores.length > 0 ? Math.min(...scores).toFixed(3) : "N/A";

  return (
    <div className="query-results-container">
      <div className="query-content">
        <div>
          Concept: {queryConcept.concept_name}
        </div>
        <div className="query-info">
          <p><strong>Hits:</strong> {totalResults}</p>
          <p><strong>Unique Patients:</strong> {uniquePatients}</p>
          <p><strong>Similarity:</strong> {minScore} - {maxScore}</p>
          
          <p><strong>Stain Distribution:</strong></p>
          <ul>
            {Object.entries(stainDistribution).map(([stain, count]) => (
              <li key={stain}>{stain}: {count} ({((count / totalResults) * 100).toFixed(1)}%)</li>
            ))}
          </ul>
          
          <p><strong>Magnification Distribution:</strong></p>
          <ul>
            {Object.entries(magnificationDistribution).map(([mag, count]) => (
              <li key={mag}>{mag}: {count} ({((count / totalResults) * 100).toFixed(1)}%)</li>
            ))}
          </ul>
          
          <p><strong>Tag Distribution:</strong></p>
          <ul>
            {Object.entries(tagDistribution)
              .sort((a, b) => b[1] - a[1]) // Sort descending by count
              .map(([tag, count]) => (
                <li key={tag}>
                  {tag}: {count} ({((count / totalResults) * 100).toFixed(1)}%)
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className="tiles-container">
        {resultTiles.map((tile, index) => (
          <TileComponent key={index} tile={tile} />
        ))}
      </div>
    </div>
  );
};

export default ConceptSimilarityResult;
