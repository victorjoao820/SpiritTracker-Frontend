import { useState } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";
import { calculateDerivedValuesFromWeight, calcWeightFromWineGallons,  calcWeightFromProofGallons} from "../../utils/helpers";

// --- AdjustContentsModal ---
export const AdjustContentsModal = ({
  isOpen,
  onClose,
  container,
  onSave,
  products = [],
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputMethod, setInputMethod] = useState("weight");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [formError, setFormError] = useState("");

  // Calculate available amounts
  const proof = container.proof || 0;
  const netWeight = container.netWeight ? Number(container.netWeight) : 0;
  const tareWeight = container.tareWeight ? Number(container.tareWeight) : 0;
  const grossWeight = tareWeight + netWeight;
  
  const { wineGallons, proofGallons } = calculateDerivedValuesFromWeight(
    tareWeight,
    grossWeight,
    proof,
    container.temperatureFahrenheit || 60
  );

  const product = products.find(p => p.id === container.productId);

  // Calculate predicted values after adjustment
  const calculatePredictedValues = () => {
    const inputAmount = parseFloat(adjustmentAmount) || 0;
    if (inputAmount <= 0) {
      return { newNetWeight: netWeight, newWineGallons: wineGallons, newProofGallons: proofGallons };
    }

    let weightAdjustment = 0;
    if (inputMethod === "weight") {
      weightAdjustment = inputAmount;
    } else if (inputMethod === "wineGallons") {
      weightAdjustment = calcWeightFromWineGallons(proof, inputAmount, container.temperatureFahrenheit || 60);
    } else if (inputMethod === "proofGallons") {
      weightAdjustment = calcWeightFromProofGallons(proof, inputAmount, container.temperatureFahrenheit || 60);
    }

    const newNetWeight = isAdding 
      ? netWeight + weightAdjustment 
      : Math.max(0, netWeight - weightAdjustment);
    
    const { wineGallons: newWG, proofGallons: newPG } = calculateDerivedValuesFromWeight(
      tareWeight,
      tareWeight + newNetWeight,
      proof,
      container.temperatureFahrenheit || 60
    );

    return { 
      newNetWeight: Math.max(0, newNetWeight), 
      newWineGallons: newWG, 
      newProofGallons: newPG 
    };
  };

  const predictedValues = calculatePredictedValues();

  const handleAdjustment = async () => {
    setFormError("");

    const inputAmount = parseFloat(adjustmentAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      setFormError("Please enter a valid adjustment amount.");
      return;
    }
    let amount = 0;
    if(inputMethod === "weight"){
      amount = inputAmount;
    }else if(inputMethod === "wineGallons"){
      amount = calcWeightFromWineGallons(proof, inputAmount, container.temperatureFahrenheit || 60);
    }else if(inputMethod === "proofGallons"){
      amount = calcWeightFromProofGallons(proof, inputAmount, container.temperatureFahrenheit || 60);
    }
    try {
      const adjustmentData = {
        containerId: container.id,
        method: isAdding?'add':'remove',
        wineGallons: wineGallons,
        amount: amount,
      };
      await onSave(adjustmentData);
      
      // Log the transaction
      logTransaction({
        transactionType: isAdding ? TRANSACTION_TYPES.ADJUST_CONTAINER_ADD : TRANSACTION_TYPES.ADJUST_CONTAINER_REMOVE,
        containerId: container.id,
        containerName: container.name || container.type,
        notes: `${isAdding ? 'Added' : 'Removed'} : ${wineGallons} WG are ${isAdding ? 'Added' : 'Removed'} from container!`,
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
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl mb-4 text-yellow-300">
          Tank Adjust: {container.name || container.type}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <p className="font-semibold text-gray-300 mb-2">Product: {product?.name || 'No Product'}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-sm text-gray-400">
            <p className="font-semibold text-gray-300 mb-2">Current:</p>
            <p>Net Weight: {netWeight.toFixed(2)} lbs</p>
            <p>Wine Gallons: {wineGallons.toFixed(2)} WG</p>
            <p>Proof Gallons: {proofGallons.toFixed(2)} PG</p>
          </div>
          <div className="text-sm text-gray-400">
            <p className="font-semibold text-yellow-300 mb-2">After Adjustment:</p>
            <p>Net Weight: <span className="text-yellow-300">{predictedValues.newNetWeight.toFixed(2)} lbs</span></p>
            <p>Wine Gallons: <span className="text-yellow-300">{predictedValues.newWineGallons.toFixed(2)} WG</span></p>
            <p>Proof Gallons: <span className="text-yellow-300">{predictedValues.newProofGallons.toFixed(2)} PG</span></p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Adjustment Type:
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdding}
                  onChange={(e) => setIsAdding(e.target.checked)}
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500"
                />
                <span>Add to container (uncheck for removal)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Adjustment Method:
            </label>
            <div className="flex space-x-3">
              <label className="flex items-center space-x-1 text-sm text-gray-200 cursor-pointer">
                <input
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500"
                  type="radio"
                  value="weight"
                  checked={inputMethod === "weight"}
                  onChange={(e) => setInputMethod(e.target.value)}
                  name="removalInputMethod"
                />
                <span>Weight (lbs)</span>
              </label>
              <label className="flex items-center space-x-1 text-sm text-gray-200 cursor-pointer">
                <input
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500"
                  type="radio"
                  value="wineGallons"
                  checked={inputMethod === "wineGallons"}
                  onChange={(e) => setInputMethod(e.target.value)}
                  name="removalInputMethod"
                />
                <span>Wine Gal</span>
              </label>
              <label className="flex items-center space-x-1 text-sm text-gray-200 cursor-pointer">
                <input
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500"
                  type="radio"
                  value="proofGallons"
                  checked={inputMethod === "proofGallons"}
                  onChange={(e) => setInputMethod(e.target.value)}
                  name="removalInputMethod"
                />
                <span>Proof Gal</span>
              </label>
            </div>
          </div>

          <input
            type="number"
            step="0.001"
            min="0"
            placeholder={`Amount to ${isAdding ? 'Add' : 'Remove'}`}
            value={adjustmentAmount}
            onChange={(e) => setAdjustmentAmount(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded mt-1 text-gray-300"
          />

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustment}
              className="bg-yellow-600 hover:bg-yellow-700 py-2 px-4 rounded text-white"
            >
              Confirm {isAdding ? 'Addition' : 'Removal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};