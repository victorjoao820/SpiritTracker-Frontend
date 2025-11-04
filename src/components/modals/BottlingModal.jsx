import { useState, useEffect } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";
import { calculateDerivedValuesFromWeight } from "../../utils/helpers";

// --- BottlingModal ---
export const BottlingModal = ({
  isOpen,
  onClose,
  container,
  onSave,
}) => {
  const [bottleSize, setBottleSize] = useState("750");
  const [numberOfBottles, setNumberOfBottles] = useState("");
  const [remainderAction, setRemainderAction] = useState("keep");
  const [adjustmentType, setAdjustmentType] = useState("loss");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [formError, setFormError] = useState("");

  // Bottle size options in liters
  const bottleSizeOptions = [
    { value: "750", label: "750 mL (Standard)" },
    { value: "375", label: "375 mL (Half)" },
    { value: "1750", label: "1.75 L (Handle)" },
    { value: "1000", label: "1.0 L (Liter)" },
    { value: "50", label: "50 mL (Mini)" },
  ];

  // Calculate available wine gallons (assuming container has this data)
  const proof = container.proof || 0;
  const netWeight = container.netWeight || 0;

  const { wineGallons, proofGallons , spiritDensity} = calculateDerivedValuesFromWeight(0, netWeight, proof, container.temperatureFahrenheit);

  const availableWG = wineGallons;

  const availablePG = proofGallons;

  // Calculate maximum bottles based on bottle size and available WG
  const calculateMaxBottles = () => {
    const sizeLiters = parseFloat(bottleSize) /1000 || 0;
    // Convert to wine gallons (1 liter = 0.264172 gallons)
    const bottleVolumeWG = sizeLiters * 0.264172;
    
    if (bottleVolumeWG === 0) return 0;
    // Round down to get maximum bottles
    return Math.floor(availableWG / bottleVolumeWG);
  };

  const maxBottles = calculateMaxBottles();
  // Update numberOfBottles when bottleSize changes or when remainderAction is "loss"
  useEffect(() => {
    if (remainderAction === "empty" && maxBottles >= 0) {
      setNumberOfBottles(maxBottles.toString());
    }
  }, [remainderAction, maxBottles, bottleSize]);

  // Calculate bottled volume in wine gallons
  const calculateBottledVolume = () => {
    const bottles = remainderAction === "empty" ? maxBottles : parseInt(numberOfBottles) || 0;
    const sizeLiters = parseFloat(bottleSize) / 1000 || 0;
    // Convert to wine gallons (1 liter = 0.264172 gallons)
    return (bottles * sizeLiters * 0.264172);
  };

  const bottledWG = calculateBottledVolume();
  const bottledPG = (bottledWG * proof) / 100;
  const remainderWG = availableWG - bottledWG;
  const remainderPG = availablePG - bottledPG;
  const remainderLbs = remainderWG * spiritDensity;

  const handleBottling = async () => {
    setFormError("");

    const bottles = remainderAction === "empty" ? maxBottles : parseInt(numberOfBottles);
    if (isNaN(bottles) || bottles <= 0) {
      setFormError("Please enter a valid number of bottles.");
      return;
    }

    // Validate adjustment amount if adjustment is selected
    if (remainderAction === "adjust") {
      const adjustAmount = parseFloat(adjustmentAmount);
      if (isNaN(adjustAmount) || adjustAmount < 0) {
        setFormError("Please enter a valid adjustment amount.");
        return;
      }
    }

    try {
      const bottlingData = {
        containerId: container.id,
        bottleSize: bottleSize,
        numberOfBottles: bottles,
        remainderAction: remainderAction,
        bottledWG: bottledWG,
        remainderLbs: remainderLbs,
      };

      // Add adjustment data if applicable
      if (remainderAction === "adjust") {
        bottlingData.remainderAction = adjustmentType;
        bottlingData.adjustmentAmount = parseFloat(adjustmentAmount);
        bottlingData.remainderLbs = 0;
      }

      await onSave(bottlingData);
      
      // Log the transaction
      logTransaction({
        transactionType: TRANSACTION_TYPES.BOTTLE_KEEP,
        containerId: container.id,
        containerName: container.name || container.type,
        notes: `Bottled ${bottles} bottles (${bottledWG.toFixed(2)} WG)`,
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
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl mb-4 font-semibold text-sky-300">
          Bottle From: {container.name || container.type}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            <strong>Available:</strong> {availableWG.toFixed(2)} WG @ {proof} Proof
          </p>

          <div className="grid grid-cols-2 gap-4 p-4 border border-gray-700 rounded-lg">
            <div>
              <label htmlFor="bottleSize" className="block text-sm font-medium text-gray-300">
                Bottle Size
              </label>
              <select
                id="bottleSize"
                value={bottleSize}
                onChange={(e) => setBottleSize(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded mt-1 text-gray-300"
              >
                {bottleSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="numBottles" className="block text-sm font-medium text-gray-300">
                Number of Bottles
              </label>
              <input
                id="numBottles"
                type="number"
                placeholder="e.g., 120"
                value={numberOfBottles}
                onChange={(e) => setNumberOfBottles(e.target.value)}
                step="1"
                min="0"
                readOnly={remainderAction === "empty"}
                className={`w-full bg-gray-700 p-2 rounded mt-1 text-gray-300 ${
                  remainderAction === "empty" ? "cursor-not-allowed opacity-75" : ""
                }`}
              />
            </div>
          </div>

          <div className="bg-gray-700 p-3 rounded text-sm text-gray-300">
            <p>
              <strong>Bottled Volume:</strong> {bottledWG.toFixed(2)} WG / {bottledPG.toFixed(2)} PG
            </p>
            <p>
              <strong>Expected Remainder:</strong>{" "}
              <span className="font-semibold text-sky-300">
                {remainderWG.toFixed(2)} WG / {remainderPG.toFixed(2)} PG
              </span>
            </p>
          </div>

          <div className="p-4 border border-gray-700 rounded-lg">
            <h4 className="text-md font-semibold text-gray-300 mb-2">Finalize Container</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  className="form-radio text-sky-500"
                  type="radio"
                  value="keep"
                  name="remainderAction"
                  checked={remainderAction === "keep"}
                  onChange={(e) => setRemainderAction(e.target.value)}
                />
                <span className="text-sm text-gray-300">Keep remainder in container</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  className="form-radio text-sky-500"
                  type="radio"
                  value="empty"
                  name="remainderAction"
                  checked={remainderAction === "empty"}
                  onChange={(e) => setRemainderAction(e.target.value)}
                />
                <span className="text-sm text-gray-300">Empty and record remainder as loss</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  className="form-radio text-sky-500"
                  type="radio"
                  value="adjust"
                  name="remainderAction"
                  checked={remainderAction === "adjust"}
                  onChange={(e) => setRemainderAction(e.target.value)}
                />
                <span className="text-sm text-gray-300">Empty and manually record Loss/Gain</span>
              </label>
            </div>

            {remainderAction === "adjust" && (
              <div className="mt-3 pt-3 border-t border-gray-600 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adjustmentType" className="block text-xs font-medium text-gray-400">
                    Adjustment Type
                  </label>
                  <select
                    id="adjustmentType"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="w-full bg-gray-600 p-2 rounded mt-1 text-sm text-gray-300"
                  >
                    <option value="loss">Bottling Loss</option>
                    <option value="gain">Bottling Gain</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="adjustmentAmount" className="block text-xs font-medium text-gray-400">
                    Amount (Wine Gallons)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="adjustmentAmount"
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      step="0.001"
                      min="0"
                      className="w-full bg-gray-600 p-2 rounded mt-1 text-sm text-gray-300"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      ({(parseFloat(adjustmentAmount) * proof / 100 || 0).toFixed(2)} PG)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleBottling}
              className="bg-sky-600 hover:bg-sky-700 py-2 px-4 rounded disabled:bg-sky-800 disabled:cursor-not-allowed text-white"
            >
              Confirm Bottling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};