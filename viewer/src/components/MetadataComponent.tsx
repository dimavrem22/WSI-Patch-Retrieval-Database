import React, { useState, useEffect } from "react";
import { SlideMetadata } from "../types";
import toast from "react-hot-toast";

interface MetadataComponentProps {
  metadata: SlideMetadata;
  onMetadataChange: (updatedMetadata: SlideMetadata) => void;
}

const MetadataComponent: React.FC<MetadataComponentProps> = ({ metadata, onMetadataChange }) => {
  const serverURL = import.meta.env.VITE_SERVER_URL;

  const [note, setNote] = useState(metadata.note);
  const [labels, setLabels] = useState(metadata.labels.join(", "));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false); // Track changes

  useEffect(() => {
    setNote(metadata.note);
    setLabels(metadata.labels.join(", "));
    setHasChanges(false); // Reset change tracking when metadata updates
  }, [metadata]);

  // Track changes in note and labels
  useEffect(() => {
    if (note !== metadata.note || labels !== metadata.labels.join(", ")) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [note, labels, metadata]);

  const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(event.target.value);
  };

  const handleLabelsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabels(event.target.value);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setHasChanges(false); // Reset change tracking when entering edit mode
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return; // Prevent saving if no changes

    setIsSaving(true);
    try {
      const payload = {
        wsi_path: metadata.location,
        note: note || null,
        labels: labels.split(", ").map((label) => label.trim()).filter((label) => label !== ""),
      };

      const response = await fetch(`${serverURL}/wsi_data_update/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Response received:", result);

      if (result.success === true) {
        toast.success("Save successful!");

        // Update metadata at parent level
        const updatedMetadata = { ...metadata, note: payload.note, labels: payload.labels };
        onMetadataChange(updatedMetadata);

        setIsEditing(false);
        setHasChanges(false); // Reset change tracking
      } else {
        toast.error("Failed to write data.");
      }
    } catch (error) {
      console.error("Error updating metadata:", error);
      toast.error("Failed to write data.");
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Slide Metadata</h2>
        {!isEditing ? (
          <button className="px-2 py-1 text-sm text-black bg-white rounded" onClick={handleEditToggle}>
            Edit
          </button>
        ) : (
          <div>
            <button
              className={`px-2 py-1 text-sm rounded mr-2 ${
                hasChanges ? "bg-green-500 text-green-800" : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button className="px-2 py-1 text-sm bg-gray-500 text-red-800 rounded" onClick={handleEditToggle}>
              Cancel
            </button>
          </div>
        )}
      </div>
      <table className="w-full border-collapse border border-gray-300 text-sm table-fixed">
        <tbody>
          <tr>
            <td className="border px-2 py-1 font-bold">WSI Location</td>
            <td className="border px-2 py-1 break-words overflow-hidden">{metadata.location}</td>
          </tr>
          <tr>
            <td className="border px-2 py-1 font-bold">Levels</td>
            <td className="border px-2 py-1">{metadata.level_count}</td>
          </tr>
          <tr>
            <td className="border px-2 py-1 font-bold">WSI Size</td>
            <td className="border px-2 py-1">
              {metadata.extent[2].toLocaleString()} x {metadata.extent[3].toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="border px-2 py-1 font-bold">MPP X</td>
            <td className="border px-2 py-1">{metadata.mpp_x}</td>
          </tr>
          <tr>
            <td className="border px-2 py-1 font-bold">MPP Y</td>
            <td className="border px-2 py-1">{metadata.mpp_y}</td>
          </tr>
          <tr>
            <td className="border px-2 py-1 font-bold">Note</td>
            <td className="border px-2 py-1 break-words overflow-hidden">
              {isEditing ? (
                <textarea className="w-full p-1 border rounded text-sm" value={note? note: ""} onChange={handleNoteChange} />
              ) : (
                <p>{note}</p>
              )}
            </td>
          </tr>
          <tr>
            <td className="border px-2 py-1 font-bold">Labels</td>
            <td className="border px-2 py-1 break-words overflow-hidden">
              {isEditing ? (
                <textarea className="w-full p-1 border rounded text-sm" value={labels} onChange={handleLabelsChange} />
              ) : (
                <p>{labels}</p>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MetadataComponent;
