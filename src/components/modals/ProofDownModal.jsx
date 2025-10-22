import { useState, useEffect } from "react";
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
  const [calculatedValues, setCalculatedValues] = useState({
    addWater: 0,
    finalWineGallons: 0,
    finalGrossWeight: 0,
    finalProofGallons: 0
  });

  // Calculate new values when target proof changes
  useEffect(() => {
    if (targetProof && container) {
      const targetProofNum = parseFloat(targetProof);
      const currentProof = parseFloat(container.proof) || 0;
      const netWeight = parseFloat(container.netWeight) || 0;
      const tareWeight = parseFloat(container.tareWeight) || 0;
      
      if (targetProofNum > 0 && targetProofNum < currentProof) {
        // Calculate wine gallons from current net weight (assuming 8.3 lbs per gallon)
        const currentWineGallons = netWeight / 8.3;
        
        // Calculate proof gallons (unchanged)
        const proofGallons = currentWineGallons * (currentProof / 100);
        
        // Calculate final wine gallons after proof down
        const finalWineGallons = proofGallons / (targetProofNum / 100);
        
        // Calculate water to add
        const addWater = finalWineGallons - currentWineGallons;
        
        // Calculate final net weight (wine gallons * 8.3)
        const finalNetWeight = finalWineGallons * 8.3;
        
        // Calculate final gross weight (tare + final net)
        const finalGrossWeight = tareWeight + finalNetWeight;
        
        setCalculatedValues({
          addWater: addWater,
          finalWineGallons: finalWineGallons,
          finalGrossWeight: finalGrossWeight,
          finalProofGallons: proofGallons
        });
      } else {
        setCalculatedValues({
          addWater: 0,
          finalWineGallons: 0,
          finalGrossWeight: 0,
          finalProofGallons: 0
        });
      }
    }
  }, [targetProof, container]);

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
        currentProof: container.proof,
        addWater: calculatedValues.addWater,
        finalWineGallons: calculatedValues.finalWineGallons,
        finalGrossWeight: calculatedValues.finalGrossWeight,
        finalProofGallons: calculatedValues.finalProofGallons
      };

      await onSave(proofDownData);
      
      // Log the transaction
      logTransaction({
        transactionType: TRANSACTION_TYPES.PROOF_DOWN,
        containerId: container.id,
        containerName: container.name || container.type,
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
          Proof Down {container.name || 'Container'}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-700 p-3 rounded">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Current Container Info:</h3>
            <p className="text-sm text-gray-400">
              Name: {container.name || 'Unnamed'}
            </p>
            <p className="text-sm text-gray-400">
              Type: {container.type?.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-gray-400">
              Current Proof: {container.proof}°
            </p>
            <p className="text-sm text-gray-400">
              Net Weight: {container.netWeight} lbs
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

          {/* Calculated Values Display */}
          {targetProof && parseFloat(targetProof) > 0 && parseFloat(targetProof) < parseFloat(container.proof) && (
            <div className="bg-blue-900 p-4 rounded border border-blue-700">
              <h3 className="text-sm font-medium text-blue-300 mb-3">New Values After Proof Down:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-800 p-2 rounded">
                  <p className="text-blue-200 font-medium">Add Water:</p>
                  <p className="text-blue-100">{calculatedValues.addWater.toFixed(2)} gallons</p>
                </div>
                <div className="bg-blue-800 p-2 rounded">
                  <p className="text-blue-200 font-medium">Final Wine Gallons:</p>
                  <p className="text-blue-100">{calculatedValues.finalWineGallons.toFixed(2)} gallons</p>
                </div>
                <div className="bg-blue-800 p-2 rounded">
                  <p className="text-blue-200 font-medium">Final Gross Weight:</p>
                  <p className="text-blue-100">{calculatedValues.finalGrossWeight.toFixed(2)} lbs</p>
                </div>
                <div className="bg-blue-800 p-2 rounded">
                  <p className="text-blue-200 font-medium">Final Proof Gallons:</p>
                  <p className="text-blue-100">{calculatedValues.finalProofGallons.toFixed(2)} gallons</p>
                </div>
              </div>
            </div>
          )}
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