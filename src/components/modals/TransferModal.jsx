import { useState, useEffect } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES, CONTAINER_CAPACITIES_GALLONS } from "../../constants";
import { calculateDerivedValuesFromWeight, calcGallonsFromWeight, calcWeightFromWineGallons, calcWeightFromProofGallons,  calculateSpiritDensity  } from "../../utils/helpers";

// --- TransferModal ---
export const TransferModal = ({
  isOpen,
  onClose,
  sourceContainer,
  allContainers,
  onSave,
  products = [],
}) => {
  const [destinationId, setDestinationId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferUnit, setTransferUnit] = useState("weight");
  const [transferAll, setTransferAll] = useState(false);
  const [formError, setFormError] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState(null);

  // Calculate available amounts for source container
  const proof = sourceContainer.proof || 0;
  const netWeight = sourceContainer.netWeight ? Number(sourceContainer.netWeight) : 0;
  const tareWeight = sourceContainer.tareWeight ? Number(sourceContainer.tareWeight) : 0;
  const grossWeight = tareWeight + netWeight;
  
  const { wineGallons, proofGallons } = calcGallonsFromWeight(
    proof,
    netWeight,
    sourceContainer.temperatureFahrenheit || 60
  );

  const product = products.find(p => p.id === sourceContainer.productId);

  // Filter available destinations (exclude source container)
  const availableDestinations = allContainers.filter((c) => c.id !== sourceContainer.id);

  // Calculate and display capacity information for selected destination
  useEffect(() => {
    if (destinationId) {
      const destContainer = allContainers.find(c => c.id === destinationId);
      if (destContainer && destContainer.type) {
        const capacityGallons = CONTAINER_CAPACITIES_GALLONS[destContainer.type] || 0;
        const destNetWeight = destContainer.netWeight ? Number(destContainer.netWeight) : 0;
        const destProof = destContainer.proof || 0;
        const destTemp = destContainer.temperatureFahrenheit || 60;
        
        const { wineGallons: currentWG } = calcGallonsFromWeight(
          destProof,
          destNetWeight,
          destTemp
        );
        
        const availableCapacityWG = capacityGallons - currentWG;
        
        setCapacityInfo({
          capacity: capacityGallons,
          current: currentWG,
          available: availableCapacityWG,
          type: destContainer.type
        });
      } else {
        setCapacityInfo(null);
      }
    } else {
      setCapacityInfo(null);
    }
  }, [destinationId, allContainers]);

  const handleTransfer = async () => {
    if (isTransferring) return;

    setFormError("");
    setIsTransferring(true);

    // Basic validation
    if (!destinationId) {
      setFormError("Please select a destination container.");
      setIsTransferring(false);
      return;
    }
    let transferAmountLbs = 0;
    let transferAmountWG = 0;
    if(transferAll) {
      transferAmountLbs = netWeight;
      transferAmountWG = wineGallons;
    } 
    else {
      if(transferUnit === 'wineGallons') 
      {
        transferAmountLbs = calcWeightFromWineGallons(proof, parseFloat(transferAmount), sourceContainer.temperatureFahrenheit || 60);
        transferAmountWG = parseFloat(transferAmount);
      } else if(transferUnit === 'proofGallons') {
        transferAmountLbs = calcWeightFromProofGallons(proof, parseFloat(transferAmount), sourceContainer.temperatureFahrenheit || 60);
        // Convert proof gallons to wine gallons
        transferAmountWG = parseFloat(transferAmount) / (proof / 100);
      } else {
        transferAmountLbs = parseFloat(transferAmount);
        transferAmountWG = transferAmountLbs / calculateSpiritDensity(proof, sourceContainer.temperatureFahrenheit || 60);
      }
    }

    if (!transferAll && (!transferAmount || parseFloat(transferAmount) <= 0)) {
      setFormError("Please enter a valid transfer amount.");
      setIsTransferring(false);
      return;
    }

    // Validate destination container capacity
    if (capacityInfo && transferAmountWG > capacityInfo.available) {
      setFormError(`❌ Transfer amount (${transferAmountWG.toFixed(2)} WG) exceeds available capacity (${capacityInfo.available.toFixed(2)} WG) in destination container.`);
      setIsTransferring(false);
      return;
    }

    // Validate that source has enough to transfer
    if (transferAmountLbs > netWeight) {
      setFormError(`❌ Transfer amount exceeds available amount in source container (${netWeight.toFixed(2)} lbs available).`);
      setIsTransferring(false);
      return;
    }
    
    try {
      const transferData = {
        sourceContainerId: sourceContainer.id, 
        destinationContainerId: destinationId,
        proof: proof,
        amount: transferAmountLbs,
        transAmountWG: transferAmountLbs / calculateSpiritDensity(proof, sourceContainer.temperatureFahrenheit || 60),
        transferAll: transferAll
      };

      console.log("transferData", transferData);
      await onSave(transferData);
      
      // Log the transaction
      let transferAmountGallons;
      if(transferUnit === 'wineGallons') {
        transferAmountGallons = transferAmount;
      } else if(transferUnit === 'proofGallons') {
        transferAmountGallons = transferAmount / (proof / 100);
      } else {
        transferAmountGallons = (wineGallons * transferAmount / netWeight).toFixed(3);
      }
      logTransaction({
        transactionType: TRANSACTION_TYPES.TRANSFER_OUT,
        containerId: sourceContainer.id,
        containerName: sourceContainer.name || sourceContainer.type,
        volumeGallons: transferAmountGallons,
        notes: `Transferred ${transferAll ? 'All' : transferAmountGallons} ${transferUnit} to container`,
      });

      onClose();
    } catch (err) {
      console.error("Transfer error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Transfer failed. Please check the values and try again.";
      setFormError(`❌ ${errorMessage}`);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  // Helper to get destination display name
  const getDestinationDisplay = (container) => {
    const destProof = container.proof || 0;
    const destNetWeight = container.netWeight ? Number(container.netWeight) : 0;
    const destTareWeight = container.tareWeight ? Number(container.tareWeight) : 0;
    const destGrossWeight = destTareWeight + destNetWeight;
    
    const { wineGallons: destWG } = calculateDerivedValuesFromWeight(
      destTareWeight,
      destGrossWeight,
      destProof,
      container.temperatureFahrenheit || 60
    );

    if (container.status === 'EMPTY') {
      return `${container.name || container.type} - Combine (Empty)`;
    }
    return `${container.name || container.type} - Combine with ${destNetWeight.toFixed(2)} lbs at ${destProof} proof`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">
          Transfer From: {sourceContainer.name || sourceContainer.type}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm font-medium animate-pulse">{formError}</div>
        )}

        <p className="text-sm text-gray-400 mb-1">
          ({product?.name || 'No Product'}) Available: {netWeight.toFixed(2)} lbs, {wineGallons.toFixed(2)} wine gal, {proofGallons.toFixed(2)} proof gal at {proof} proof.
        </p>

        <p className="text-xs text-blue-400 mb-3">
          💡 You can transfer to empty containers or combine with other {product?.name || 'product'} containers
        </p>

        {/* Capacity Information */}
        {capacityInfo && (
          <div className="bg-blue-900 bg-opacity-50 p-3 rounded mb-4 text-sm">
            <p className="text-blue-300 font-semibold mb-1">Destination Capacity:</p>
            <div className="grid grid-cols-2 gap-2 text-gray-300">
              <div>
                <span className="text-gray-400">Total Capacity:</span> {capacityInfo.capacity.toFixed(2)} WG
              </div>
              <div>
                <span className="text-gray-400">Current Fill:</span> {capacityInfo.current.toFixed(2)} WG
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Available:</span> 
                <span className={`font-semibold ${capacityInfo.available < 0 ? 'text-red-400' : capacityInfo.available < 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {' '}{capacityInfo.available.toFixed(2)} WG
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded mt-1 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-300"
            disabled={isTransferring}
          >
            <option value="">-- Select Destination --</option>
            {availableDestinations.map((container) => (
              <option key={container.id} value={container.id}>
                {getDestinationDisplay(container)}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Transfer by:</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="weight"
                  checked={transferUnit === "weight"}
                  onChange={(e) => setTransferUnit(e.target.value)}
                  name="transferUnit"
                  className="mr-2 h-4 w-4 text-blue-500 border-gray-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isTransferring}
                />
                <span className="text-sm text-gray-300">Weight (lbs)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="wineGallons"
                  checked={transferUnit === "wineGallons"}
                  onChange={(e) => setTransferUnit(e.target.value)}
                  name="transferUnit"
                  className="mr-2 h-4 w-4 text-blue-500 border-gray-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isTransferring}
                />
                <span className="text-sm text-gray-300">Wine Gal</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="proofGallons"
                  checked={transferUnit === "proofGallons"}
                  onChange={(e) => setTransferUnit(e.target.value)}
                  name="transferUnit"
                  className="mr-2 h-4 w-4 text-blue-500 border-gray-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isTransferring}
                />
                <span className="text-sm text-gray-300">Proof Gal</span>
              </label>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <p>• <strong>Weight:</strong> Direct net weight transfer in pounds</p>
              <p>• <strong>Wine Gal:</strong> Volume-based transfer (accounts for proof)</p>
              <p>• <strong>Proof Gal:</strong> Standard proof gallon measurement</p>
            </div>
          </div>

          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder={`Net ${transferUnit === 'weight' ? 'Lbs' : transferUnit === 'wineGallons' ? 'Wine Gal' : 'Proof Gal'} to Transfer`}
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded mt-1 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-300"
            disabled={isTransferring || transferAll}
          />

          <div className="flex items-center">
            <input
              id="transferAll"
              type="checkbox"
              checked={transferAll}
              onChange={(e) => setTransferAll(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-500 border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTransferring}
            />
            <label htmlFor="transferAll" className="text-sm text-gray-300 cursor-pointer">
              Transfer All
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isTransferring}
              className="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={isTransferring}
              className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};