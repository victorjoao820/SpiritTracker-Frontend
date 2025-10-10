import { useState } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";

// --- BottlingModal ---
export const BottlingModal = ({
  isOpen,
  onClose,
  container,
  onSave,
}) => {
  const [bottlingType, setBottlingType] = useState("partial");
  const [bottleSize, setBottleSize] = useState("750ml");
  const [numberOfBottles, setNumberOfBottles] = useState("");
  const [formError, setFormError] = useState("");

  const handleBottling = async () => {
    setFormError("");

    const bottles = parseInt(numberOfBottles);
    if (isNaN(bottles) || bottles <= 0) {
      setFormError("Please enter a valid number of bottles.");
      return;
    }

    try {
      const bottlingData = {
        containerId: container.id,
        bottlingType: bottlingType,
        bottleSize: bottleSize,
        numberOfBottles: bottles
      };

      await onSave(bottlingData);
      
      // Log the transaction
      logTransaction({
        transactionType: bottlingType === "partial" ? TRANSACTION_TYPES.BOTTLE_PARTIAL : TRANSACTION_TYPES.BOTTLE_EMPTY,
        containerId: container.id,
        containerName: container.containerType,
        notes: `Bottled ${bottles} ${bottleSize} bottles`,
      });

      onClose();
    } catch (err) {
      console.error("Bottling error:", err);
      setFormError("Bottling failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Bottle from {container.containerType}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bottling Type
            </label>
            <select
              value={bottlingType}
              onChange={(e) => setBottlingType(e.target.value)}
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="partial">Partial Bottling</option>
              <option value="empty">Empty Container</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bottle Size
            </label>
            <select
              value={bottleSize}
              onChange={(e) => setBottleSize(e.target.value)}
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="375ml">375ml</option>
              <option value="750ml">750ml</option>
              <option value="1L">1L</option>
              <option value="1.75L">1.75L</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Number of Bottles
            </label>
            <input
              type="number"
              value={numberOfBottles}
              onChange={(e) => setNumberOfBottles(e.target.value)}
              placeholder="Enter number of bottles"
              className="w-full bg-gray-700 p-2 rounded"
            />
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
            onClick={handleBottling}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Bottle
          </button>
        </div>
      </div>
    </div>
  );
};