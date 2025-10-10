import { useState } from "react";

// --- ImportContainersModal ---
export const ImportContainersModal = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [csvData, setCsvData] = useState("");
  const [formError, setFormError] = useState("");

  const handleImport = async () => {
    setFormError("");

    if (!csvData.trim()) {
      setFormError("Please paste CSV data.");
      return;
    }

    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',');
      const containers = lines.slice(1).map(line => {
        const values = line.split(',');
        const container = {};
        headers.forEach((header, index) => {
          container[header.trim()] = values[index]?.trim() || '';
        });
        return container;
      });

      await onImport(containers);
      onClose();
    } catch (err) {
      console.error("Import error:", err);
      setFormError("Import failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Import Containers
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              CSV Data
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Paste CSV data here..."
              rows="10"
              className="w-full bg-gray-700 p-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expected format: containerType,volumeGallons,status,proof
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};