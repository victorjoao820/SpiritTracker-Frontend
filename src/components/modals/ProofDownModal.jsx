import { useState } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";

// --- ProofDownModal ---
export const ProofDownModal = ({
  isOpen,
  onClose,
  container,
  onSave,
}) => {
  const [targetProof, setTargetProof] = useState("");
  const [formError, setFormError] = useState("");

  const handleProofDown = async () => {
    setFormError("");

    const targetProofNum = parseFloat(targetProof);
    if (isNaN(targetProofNum) || targetProofNum <= 0) {
      setFormError("Please enter a valid target proof.");
      return;
    }

    if (targetProofNum >= container.proof) {
      setFormError("Target proof must be lower than current proof.");
      return;
    }

    try {
      const proofDownData = {
        containerId: container.id,
        targetProof: targetProofNum,
        currentProof: container.proof
      };

      await onSave(proofDownData);
      
      // Log the transaction
      logTransaction({
        transactionType: TRANSACTION_TYPES.PROOF_DOWN,
        containerId: container.id,
        containerName: container.containerType,
        proof: targetProofNum,
        notes: `Proofed down from ${container.proof} to ${targetProofNum}`,
      });

      onClose();
    } catch (err) {
      console.error("Proof down error:", err);
      setFormError("Proof down failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Proof Down {container.containerType}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-700 p-3 rounded">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Current Container Info:</h3>
            <p className="text-sm text-gray-400">
              Type: {container.containerType}
            </p>
            <p className="text-sm text-gray-400">
              Current Proof: {container.proof}
            </p>
            <p className="text-sm text-gray-400">
              Volume: {container.volumeGallons} gallons
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target Proof
            </label>
            <input
              type="number"
              step="0.1"
              value={targetProof}
              onChange={(e) => setTargetProof(e.target.value)}
              placeholder="Enter target proof"
              className="w-full bg-gray-700 p-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be lower than current proof ({container.proof})
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
            onClick={handleProofDown}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Proof Down
          </button>
        </div>
      </div>
    </div>
  );
};