import { useState, useEffect } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";
import { calculateDerivedValuesFromWeight } from "../../utils/helpers";
import { bottlingRunsAPI, productsAPI } from "../../services/api";

// --- BottlingModal ---
export const BottlingModal = ({
  isOpen,
  onClose,
  container,
  onSave,
  onAdd, // Optional callback for adding without closing (for multi-add mode)
}) => {
  const [bottleSize, setBottleSize] = useState("750");
  const [numberOfBottles, setNumberOfBottles] = useState("");
  const [inputMode, setInputMode] = useState("bottle"); // "bottle" or "case"
  const [remainderAction, setRemainderAction] = useState("keep");
  const [adjustmentType, setAdjustmentType] = useState("loss");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [bottlingCount, setBottlingCount] = useState(0); // Track number of bottlings added
  const [successMessage, setSuccessMessage] = useState(""); // Success message for each addition
  const [addedBottlings, setAddedBottlings] = useState([]); // Store list of added bottlings

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
  const maxCases = Math.floor(maxBottles / 12);
  
  // Helper function to generate product abbreviation from name
  // Uses first 2 letters of each word, separated by dots
  // Example: "Bonfire Cinnamon Whiskey" -> "BO.CI.WH"
  const getProductAbbreviation = (productName) => {
    if (!productName) return 'PROD';
    
    // Split by spaces and take first 2 letters of each word
    const words = productName.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return 'PROD';
    
    // Take first 2 letters of each word, uppercase, separated by dots
    return words.map(word => {
      const firstTwo = word.substring(0, 2).toUpperCase();
      return firstTwo;
    }).join('.');
  };

  // Helper function to generate batch number based on product
  const generateBatchNumber = async (productId) => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    if (!productId) {
      return `BTL-UNK-${dateStr}`;
    }
    
    try {
      // Fetch product information
      const product = await productsAPI.getById(productId);
      
      if (product) {
        // Generate abbreviation from product name (first 2 letters of each word, separated by dots)
        const productAbbr = getProductAbbreviation(product.name);
        
        // Format: BTL-{PRODUCT}-{DATE}
        // Example: "Bonfire Cinnamon Whiskey" -> "BTL-BO.CI.WH-20251117"
        return `BTL-${productAbbr}-${dateStr}`;
      }
    } catch (err) {
      console.error("Error fetching product for batch number:", err);
    }
    
    // Fallback if product fetch fails
    return `BTL-PROD-${dateStr}`;
  };

  // Helper function to create or update bottling run record
  const createBottlingRunRecord = async (bottles, bottledWG) => {
    try {
      // Save bottle size in mL (original value like 750, 375, 1750, 1000, 50)
      const bottleSizeMl = parseFloat(bottleSize);
      const productId = container.productId || null;
      
      // Check if there's an existing bottling run with the same product and bottle size
      const existingRuns = await bottlingRunsAPI.getAll();
      const matchingRun = existingRuns.find(run => 
        run.productId === productId && 
        Math.abs(parseFloat(run.bottleSize) - bottleSizeMl) < 0.01 && // Allow small floating point differences (compare in mL)
        run.status === 'COMPLETED'
      );
      
      if (matchingRun) {
        // Update existing bottling run by adding new bottles
        // Keep the same batch number (same product = same batch number)
        const newBottlesProduced = matchingRun.bottlesProduced + bottles;
        const newVolumeGallons = parseFloat(matchingRun.volumeGallons) + parseFloat(bottledWG.toFixed(2));
        
        // Update notes to include this bottling
        const existingNotes = matchingRun.notes || '';
        const newNote = `Bottled from container: ${container.name || container.type} (${container.id})`;
        const updatedNotes = existingNotes ? `${existingNotes}; ${newNote}` : newNote;
        
        await bottlingRunsAPI.update(matchingRun.id, {
          bottlesProduced: newBottlesProduced,
          volumeGallons: newVolumeGallons,
          endDate: new Date().toISOString(), // Update end date to current time
          notes: updatedNotes
        });
      } else {
        // Create new bottling run
        // Generate batch number based on product (same product = same batch number format)
        const batchNumber = await generateBatchNumber(productId);
        
        // Create bottling run data
        const bottlingRunData = {
          batchNumber: batchNumber,
          productId: productId,
          bottleSize: bottleSizeMl, // in mL (750, 375, 1750, 1000, 50, etc.)
          bottlesProduced: bottles,
          volumeGallons: parseFloat(bottledWG.toFixed(2)),
          proof: proof,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          status: 'COMPLETED',
          notes: `Bottled from container: ${container.name || container.type} (${container.id})`
        };
        
        await bottlingRunsAPI.create(bottlingRunData);
      }
    } catch (err) {
      console.error("Error creating/updating bottling run record:", err);
      // Don't throw error - bottling operation should still succeed even if record creation fails
    }
  };
  
  // Reset bottling count and list when modal opens
  useEffect(() => {
    if (isOpen) {
      setBottlingCount(0);
      setSuccessMessage("");
      setAddedBottlings([]);
    }
  }, [isOpen]);
  
  // Update numberOfBottles when bottleSize changes or when remainderAction is "loss"
  useEffect(() => {
    if (remainderAction === "empty" && maxBottles >= 0) {
      if (inputMode === "case") {
        setNumberOfBottles(maxCases.toString());
      } else {
        setNumberOfBottles(maxBottles.toString());
      }
    }
  }, [remainderAction, maxBottles, maxCases, bottleSize, inputMode]);

  // Calculate bottled volume in wine gallons
  const calculateBottledVolume = () => {
    let bottles = 0;
    if (remainderAction === "empty") {
      bottles = maxBottles;
    } else {
      const inputValue = parseInt(numberOfBottles) || 0;
      // Convert cases to bottles if in case mode
      bottles = inputMode === "case" ? inputValue * 12 : inputValue;
    }
    const sizeLiters = parseFloat(bottleSize) / 1000 || 0;
    // Convert to wine gallons (1 liter = 0.264172 gallons)
    return (bottles * sizeLiters * 0.264172);
  };

  const bottledWG = calculateBottledVolume();
  const bottledPG = (bottledWG * proof) / 100;
  const remainderWG = availableWG - bottledWG;
  const remainderPG = availablePG - bottledPG;
  const remainderLbs = remainderWG * spiritDensity;

  // Helper function to validate and calculate bottles
  const validateAndCalculateBottles = () => {
    let bottles = 0;
    if (remainderAction === "empty") {
      bottles = maxBottles;
    } else {
      const inputValue = parseInt(numberOfBottles);
      if (isNaN(inputValue) || inputValue <= 0) {
        setFormError(`Please enter a valid number of ${inputMode === "case" ? "cases" : "bottles"}.`);
        return null;
      }
      // Convert cases to bottles if in case mode
      bottles = inputMode === "case" ? inputValue * 12 : inputValue;
    }
    
    if (bottles <= 0) {
      setFormError("Please enter a valid number of bottles.");
      return null;
    }

    // Validate adjustment amount if adjustment is selected
    if (remainderAction === "adjust") {
      const adjustAmount = parseFloat(adjustmentAmount);
      if (isNaN(adjustAmount) || adjustAmount < 0) {
        setFormError("Please enter a valid adjustment amount.");
        return null;
      }
    }

    return bottles;
  };

  // Add bottling to queue (don't save yet - wait for Confirm)
  const handleAddBottling = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setFormError("");
    setSuccessMessage("");

    const bottles = validateAndCalculateBottles();
    if (bottles === null) return;

    // Prepare bottling data (but don't save yet)
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

    // Increment count
    const newCount = bottlingCount + 1;
    setBottlingCount(newCount);
    
    // Prepare display info for the list
    const sizeLabel = bottleSizeOptions.find(opt => opt.value === bottleSize)?.label || `${bottleSize}mL`;
    const quantityText = inputMode === "case" 
      ? `${numberOfBottles} cases (${bottles} bottles)` 
      : `${bottles} bottles`;
    
    // Add to the list of queued bottlings (store full data for saving later)
    const bottlingRecord = {
      id: Date.now(), // Simple ID for list key
      bottlingData: bottlingData, // Store full data for saving
      sizeLabel: sizeLabel,
      quantityText: quantityText,
      bottles: bottles,
      bottledWG: bottledWG,
      bottledPG: bottledPG,
      inputMode: inputMode,
      numberOfBottles: numberOfBottles,
    };
    setAddedBottlings(prev => [...prev, bottlingRecord]);

    // Reset form for next entry (keep bottle size and mode, but clear quantity)
    setNumberOfBottles("");
    setAdjustmentAmount("");
    // Note: We keep remainderAction, bottleSize, and inputMode for convenience
  };

  const handleBottling = async () => {
    setFormError("");
    setSuccessMessage("");

    // If there are queued bottlings, save all of them
    if (addedBottlings.length > 0) {
      try {
        // Save all queued bottlings
        for (const bottlingRecord of addedBottlings) {
          const bottlingData = bottlingRecord.bottlingData;
          
          // Use onAdd if available (for multi-add mode), otherwise use onSave
          if (onAdd) {
            await onAdd(bottlingData);
          } else {
            await onSave(bottlingData);
          }
          
          // Log the transaction
          logTransaction({
            transactionType: TRANSACTION_TYPES.BOTTLE_KEEP,
            containerId: container.id,
            containerName: container.name || container.type,
            notes: `Bottled ${bottlingRecord.bottles} bottles (${bottlingRecord.bottledWG.toFixed(2)} WG)`,
          });
          
          // Create bottling run record
          await createBottlingRunRecord(
            bottlingRecord.bottles,
            bottlingRecord.bottledWG
          );
        }
        
        // If there's also a current input value, save that too
        if (numberOfBottles && parseFloat(numberOfBottles) > 0 && remainderAction !== "empty") {
          const bottles = validateAndCalculateBottles();
          if (bottles !== null) {
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

            if (onAdd) {
              await onAdd(bottlingData);
            } else {
              await onSave(bottlingData);
            }
            
            logTransaction({
              transactionType: TRANSACTION_TYPES.BOTTLE_KEEP,
              containerId: container.id,
              containerName: container.name || container.type,
              notes: `Bottled ${bottles} bottles (${bottledWG.toFixed(2)} WG)`,
            });
            
            // Create bottling run record
            await createBottlingRunRecord(bottles, bottledWG, bottledPG);
          }
        }
        
        onClose();
      } catch (err) {
        console.error("Bottling error:", err);
        setFormError("Bottling failed: " + err.message);
      }
      return;
    }

    // No queued bottlings - handle single bottling (original behavior)
    const bottles = validateAndCalculateBottles();
    if (bottles === null) return;

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
      
      // Create bottling run record
      await createBottlingRunRecord(bottles, bottledWG, bottledPG);

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

        {successMessage && (
          <div className="bg-green-600 p-3 rounded mb-4 text-sm">{successMessage}</div>
        )}

        {bottlingCount > 0 && (
          <div className="bg-blue-600 p-2 rounded mb-4 text-sm text-center">
            {bottlingCount} bottling{bottlingCount > 1 ? 's' : ''} queued. Click "Confirm All" to save them, or continue adding with "+" button.
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            <strong>Available:</strong> {availableWG.toFixed(2)} WG @ {proof} Proof
          </p>

          <div className="grid grid-cols-2 gap-4 p-4 border border-gray-700 rounded-lg">
            <div>
              <label htmlFor="bottleSize" className="block text-sm font-medium mb-1 text-gray-300">
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="numBottles" className="block text-sm font-medium text-gray-300">
                  {inputMode === "case" ? "Number of Cases" : "Number of Bottles"}
                </label>
                <div className="flex items-center space-x-2">
                  {/* <span className="text-xs text-gray-400">Bottle</span> */}
                  <button
                    type="button"
                    onClick={() => {
                      const newMode = inputMode === "bottle" ? "case" : "bottle";
                      // Convert current value when switching modes
                      const currentValue = parseFloat(numberOfBottles) || 0;
                      if (currentValue > 0) {
                        if (inputMode === "bottle") {
                          // Converting from bottles to cases
                          setNumberOfBottles((currentValue / 12).toString());
                        } else {
                          // Converting from cases to bottles
                          setNumberOfBottles((currentValue * 12).toString());
                        }
                      }
                      setInputMode(newMode);
                    }}
                    className={`relative inline-flex h-1 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      inputMode === "case" ? "bg-sky-600" : "bg-gray-600"
                    }`}
                    role="switch"
                    aria-checked={inputMode === "case"}
                    title={`Toggle to ${inputMode === "bottle" ? "Case" : "Bottle"} mode`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        inputMode === "case" ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  {/* <span className="text-xs text-gray-400">Case</span> */}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="numBottles"
                  type="number"
                  placeholder={inputMode === "case" ? "e.g., 5" : "e.g., 120"}
                  value={numberOfBottles}
                  onChange={(e) => setNumberOfBottles(e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent Enter key from submitting/closing modal
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (remainderAction !== "empty" && numberOfBottles && parseFloat(numberOfBottles) > 0) {
                        handleAddBottling(e);
                      }
                    }
                  }}
                  step="1"
                  min="0"
                  readOnly={remainderAction === "empty"}
                  className={`w-full bg-gray-700 p-2 rounded mt-1 text-gray-300 ${
                    remainderAction === "empty" ? "cursor-not-allowed opacity-75" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddBottling(e);
                  }}
                  disabled={remainderAction === "empty" || !numberOfBottles || parseFloat(numberOfBottles) <= 0}
                  className="mt-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded transition-colors"
                  title="Add this bottling and continue"
                >
                  +
                </button>
              </div>
              {inputMode === "case" && numberOfBottles && parseFloat(numberOfBottles) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  = {parseFloat(numberOfBottles) * 12} bottles
                </p>
              )}
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

          {/* Show list of added bottlings */}
          {addedBottlings.length > 0 && (
            <div className="bg-gray-700 p-3 rounded text-sm">
              <h4 className="font-semibold text-gray-300 mb-2">Queued Bottlings ({addedBottlings.length}):</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {addedBottlings.map((bottling, index) => (
                  <div 
                    key={bottling.id} 
                    className="bg-gray-600 p-2 rounded border-l-4 border-green-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-200 font-medium">
                          {index + 1}. {bottling.sizeLabel} × {bottling.quantityText}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {bottling.bottledWG.toFixed(2)} WG / {bottling.bottledPG.toFixed(2)} PG
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-600">
                <p className="text-gray-300">
                  <strong>Total Added:</strong>{" "}
                  <span className="text-sky-300">
                    {addedBottlings.reduce((sum, b) => sum + b.bottles, 0)} bottles
                  </span>
                  {" / "}
                  <span className="text-sky-300">
                    {addedBottlings.reduce((sum, b) => sum + b.bottledWG, 0).toFixed(2)} WG
                  </span>
                  {" / "}
                  <span className="text-sky-300">
                    {addedBottlings.reduce((sum, b) => sum + b.bottledPG, 0).toFixed(2)} PG
                  </span>
                </p>
              </div>
            </div>
          )}

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
              {bottlingCount > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleBottling}
              disabled={bottlingCount === 0 && (!numberOfBottles || parseFloat(numberOfBottles) <= 0) && remainderAction !== "empty"}
              className="bg-sky-600 hover:bg-sky-700 py-2 px-4 rounded disabled:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              title={bottlingCount > 0 ? `Confirm all ${bottlingCount} queued bottling${bottlingCount > 1 ? 's' : ''} and close` : "Confirm single bottling operation"}
            >
              {bottlingCount > 0 ? `Confirm All (${bottlingCount})` : "Confirm Bottling"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};