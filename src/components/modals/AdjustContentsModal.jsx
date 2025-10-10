import { useState } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";

// --- AdjustContentsModal ---
export const AdjustContentsModal = ({
  isOpen,
  onClose,
  container,
  onSave,
}) => {
  const [adjustmentType, setAdjustmentType] = useState("sample");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const handleAdjustment = async () => {
    setFormError("");

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid adjustment amount.");
      return;
    }

    try {
      const adjustmentData = {
        containerId: container.id,
        adjustmentType: adjustmentType,
        amount: amount,
        notes: notes.trim()
      };

      await onSave(adjustmentData);
      
      // Log the transaction
      logTransaction({
        transactionType: TRANSACTION_TYPES.SAMPLE_ADJUST,
        containerId: container.id,
        containerName: container.containerType,
        volumeGallons: -amount,
        notes: `${adjustmentType} adjustment: ${notes}`,
      });

      onClose();
    } catch (err) {
      console.error("Adjustment error:", err);
      setFormError("Adjustment failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Adjust Contents - {container.containerType}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="sample">Sample</option>
              <option value="loss">Loss</option>
              <option value="gain">Gain</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount (Gallons)
            </label>
            <input
              type="number"
              step="0.01"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              placeholder="Enter adjustment amount"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows="3"
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
            onClick={handleAdjustment}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Apply Adjustment
          </button>
        </div>
      </div>
    </div>
  );
};