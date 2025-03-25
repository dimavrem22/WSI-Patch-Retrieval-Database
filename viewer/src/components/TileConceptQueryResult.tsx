import React from "react";
import TileComponent from "./TileComponent";
import { Tile, Concept } from "../types";

interface TileConceptQueryResultsProps {
  queryTile: Tile;
  resultConcepts: Concept[];
}

const TileConceptQueryResults: React.FC<TileConceptQueryResultsProps> = ({
  queryTile,
  resultConcepts,
}) => {
  const sortedConcepts = [...resultConcepts].sort((a, b) => {
    const scoreA = a.score ?? -Infinity;
    const scoreB = b.score ?? -Infinity;
    return scoreB - scoreA;
  });

  return (
    <div className="h-screen w-full p-[5px] box-border flex flex-col">
      {/* Tile always centered on top */}
      <div className="flex justify-center flex-none mb-4">
        <TileComponent tile={queryTile} />
      </div>

      {/* Scrollable table without outer border */}
      <div className="w-full overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Concept Name</th>
                <th className="px-4 py-2 text-left">Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedConcepts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={3}>
                    No results found.
                  </td>
                </tr>
              ) : (
                sortedConcepts.map((concept, index) => (
                  <tr key={concept.uuid} className="border-t border-gray-100">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{concept.concept_name}</td>
                    <td className="px-4 py-2">{concept.score ?? "N/A"}</td>
                  </tr>
                ))
              )}
              {/* Padding row to avoid last row cutoff */}
              <tr aria-hidden="true" className="h-[40px]">
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TileConceptQueryResults;
