import { useEffect, useState } from "react";
import {
  calculateSpiritDensity,
  calculateDerivedValuesFromWeight,
  calculateDerivedValuesFromWineGallons,
  calculateDerivedValuesFromProofGallons,
} from "../../utils/helpers";

export const AddEditDistillationModal = ({
  isOpen,
  onClose,
  mode,
  batch,
  products = [],
  fermentationBatches = [],
  containers = [],
  onSave,
}) => {

  const isEdit = mode === "edit";
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 16),
    fermentationId: "",
    chargeInputMethod: "weight",
    chargeProof: "",
    chargeTemperature: 68,
    chargeWeight: "",
    yieldInputMethod: "weight",
    yieldProof: "",
    yieldTemperature: 68,
    yieldWeight: "",
    storeYieldContainer: "",
    productId: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");
  
  // State for calculated values - Charge section
  const [chargeCalculated, setChargeCalculated] = useState({
    netWeightLbs: 0,
    wineGallons: 0,
    proofGallons: 0,
  });
  
  // State for calculated values - Yield section
  const [yieldCalculated, setYieldCalculated] = useState({
    netWeightLbs: 0,
    wineGallons: 0,
    proofGallons: 0,
  });
  
  // State for charge wine gallons and proof gallons inputs (when method is not weight)
  const [chargeWineGallonsInput, setChargeWineGallonsInput] = useState("");
  const [chargeProofGallonsInput, setChargeProofGallonsInput] = useState("");
  
  // State for yield wine gallons and proof gallons inputs (when method is not weight)
  const [yieldWineGallonsInput, setYieldWineGallonsInput] = useState("");
  const [yieldProofGallonsInput, setYieldProofGallonsInput] = useState("");

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && batch) {
      setFormData({
        name: batch.batchName || "",
        date: batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 16) : "",
        fermentationId: batch.fermentationId || "",
        chargeInputMethod: "weight",
        chargeProof: batch.chargeProof?.toString() || "",
        chargeTemperature: batch.chargeTemperature || 68,
        chargeWeight: batch.chargeVolumeGallons?.toString() || "",
        yieldInputMethod: "weight",
        yieldProof: batch.yieldProof?.toString() || "",
        yieldTemperature: batch.yieldTemperature || 68,
        yieldWeight: batch.yieldVolumeGallons?.toString() || "",

        status: batch?.status,
        productId: batch.productId || "Hello", 
        storeYieldContainer: batch.storeYieldContainer || "",
        notes: batch.notes || ""
      });
    }
  }, [isEdit, batch]);

  // Calculate charge values
  useEffect(() => {
    const proof = parseFloat(formData.chargeProof) || 0;
    const temperature = parseFloat(formData.chargeTemperature) || 68;
    
    if (formData.chargeInputMethod === "weight") {
      const weight = parseFloat(formData.chargeWeight) || 0;
      // For distillation, weight is net weight (no tare weight)
      if (weight > 0 && proof > 0) {
        const calculated = calculateDerivedValuesFromWeight(0, weight, proof, temperature);
        setChargeCalculated({
          netWeightLbs: calculated.netWeightLbs,
          wineGallons: calculated.wineGallons,
          proofGallons: calculated.proofGallons,
        });
      } else {
        setChargeCalculated({
          netWeightLbs: weight || 0,
          wineGallons: 0,
          proofGallons: 0,
        });
      }
    } else if (formData.chargeInputMethod === "wineGallons") {
      const wineGallons = parseFloat(chargeWineGallonsInput) || 0;
      if (wineGallons > 0 && proof > 0) {
        const calculated = calculateDerivedValuesFromWineGallons(wineGallons, proof, 0, temperature);
        setChargeCalculated({
          netWeightLbs: calculated.netWeightLbs,
          wineGallons: calculated.wineGallons,
          proofGallons: calculated.proofGallons,
        });
      } else {
        setChargeCalculated({
          netWeightLbs: 0,
          wineGallons: wineGallons || 0,
          proofGallons: 0,
        });
      }
    } else if (formData.chargeInputMethod === "proofGallons") {
      const proofGallons = parseFloat(chargeProofGallonsInput) || 0;
      if (proofGallons > 0 && proof > 0) {
        const calculated = calculateDerivedValuesFromProofGallons(proofGallons, proof, 0, temperature);
        setChargeCalculated({
          netWeightLbs: calculated.netWeightLbs,
          wineGallons: calculated.wineGallons,
          proofGallons: calculated.proofGallons,
        });
      } else {
        setChargeCalculated({
          netWeightLbs: 0,
          wineGallons: 0,
          proofGallons: proofGallons || 0,
        });
      }
    }
  }, [formData.chargeInputMethod, formData.chargeWeight, formData.chargeProof, formData.chargeTemperature, chargeWineGallonsInput, chargeProofGallonsInput]);
  
  // Calculate yield values
  useEffect(() => {
    const proof = parseFloat(formData.yieldProof) || 0;
    const temperature = parseFloat(formData.yieldTemperature) || 68;
    
    if (formData.yieldInputMethod === "weight") {
      const weight = parseFloat(formData.yieldWeight) || 0;
      // For distillation, weight is net weight (no tare weight)
      if (weight > 0 && proof > 0) {
        const calculated = calculateDerivedValuesFromWeight(0, weight, proof, temperature);
        setYieldCalculated({
          netWeightLbs: calculated.netWeightLbs,
          wineGallons: calculated.wineGallons,
          proofGallons: calculated.proofGallons,
        });
      } else {
        setYieldCalculated({
          netWeightLbs: weight || 0,
          wineGallons: 0,
          proofGallons: 0,
        });
      }
    } else if (formData.yieldInputMethod === "wineGallons") {
      const wineGallons = parseFloat(yieldWineGallonsInput) || 0;
      if (wineGallons > 0 && proof > 0) {
        const calculated = calculateDerivedValuesFromWineGallons(wineGallons, proof, 0, temperature);
        setYieldCalculated({
          netWeightLbs: calculated.netWeightLbs,
          wineGallons: calculated.wineGallons,
          proofGallons: calculated.proofGallons,
        });
      } else {
        setYieldCalculated({
          netWeightLbs: 0,
          wineGallons: wineGallons || 0,
          proofGallons: 0,
        });
      }
    } else if (formData.yieldInputMethod === "proofGallons") {
      const proofGallons = parseFloat(yieldProofGallonsInput) || 0;
      if (proofGallons > 0 && proof > 0) {
        const calculated = calculateDerivedValuesFromProofGallons(proofGallons, proof, 0, temperature);
        setYieldCalculated({
          netWeightLbs: calculated.netWeightLbs,
          wineGallons: calculated.wineGallons,
          proofGallons: calculated.proofGallons,
        });
      } else {
        setYieldCalculated({
          netWeightLbs: 0,
          wineGallons: 0,
          proofGallons: proofGallons || 0,
        });
      }
    }
  }, [formData.yieldInputMethod, formData.yieldWeight, formData.yieldProof, formData.yieldTemperature, yieldWineGallonsInput, yieldProofGallonsInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "chargeWineGallonsInput") {
      setChargeWineGallonsInput(value);
    } else if (name === "chargeProofGallonsInput") {
      setChargeProofGallonsInput(value);
    } else if (name === "yieldWineGallonsInput") {
      setYieldWineGallonsInput(value);
    } else if (name === "yieldProofGallonsInput") {
      setYieldProofGallonsInput(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Basic validation
    if (!formData.name.trim()) {
      setFormError("Batch Name/ID is required");
      return;
    }
    if (!formData.productId) {
      setFormError("Product is required");
      return;
    }
    if (!formData.fermentationId) {
      setFormError("Source fermentation batch is required");
      return;
    }

    if (!formData.storeYieldContainer) {
      setFormError("Yield container is required");
      return;
    }
    if (!formData.yieldWeight) {
      setFormError("Yield weight is required");
      return;
    }
    if (!formData.yieldProof) {
      setFormError("Yield proof is required");
      return;
    }
    if (!formData.chargeWeight) {
      setFormError("Charge weight is required");
      return;
    }
    if (!formData.chargeProof) {
      setFormError("Charge proof is required");
      return;
    }

    const selectedContainer = containers.find(c => c.id === formData.storeYieldContainer);
    console.log("selectedContainer:", selectedContainer);
    console.log("formData:", formData);
    const yieldVolumeGallons = formData.yieldWeight ? parseFloat(formData.yieldWeight) /calculateSpiritDensity(formData.yieldProof, formData.yieldTemperature) : 0;
    if(yieldVolumeGallons > selectedContainer.containerKind?.capacityGallons) {
      setFormError("Yield volume exceeds container capacity");
      return;
    }

    try {
      // Prepare distillation data for API
      const distillationData = {
        batchName: formData.name.trim(),
        startDate: formData.date || null,
        fermentationId: formData.fermentationId,
        // chargeInputMethod: formData.chargeInputMethod,
        chargeProof: formData.chargeProof ? parseFloat(formData.chargeProof) : null,
        chargeTemperature: formData.chargeTemperature ? parseFloat(formData.chargeTemperature) : null,
        chargeVolumeGallons: formData.chargeWeight ? parseFloat(formData.chargeWeight) : null,
        // yieldInputMethod: formData.yieldInputMethod,
        yieldProof: formData.yieldProof ? parseFloat(formData.yieldProof) : null,
        yieldTemperature: formData.yieldTemperature ? parseFloat(formData.yieldTemperature) : null,
        yieldVolumeGallons: formData.yieldWeight ? parseFloat(formData.yieldWeight) : null,
        storeYieldContainer: formData.storeYieldContainer,
        // productId: products.find(p => p.name === formData.productId)?.id || null,
        productId: formData.productId || null,
        notes: formData.notes.trim() || null
      };

      // Call the onSave function passed from parent
      await onSave(distillationData);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      setFormError("Save failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  const title = isEdit ? "Edit Distillation" : "New Distillation";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl mb-6 text-blue-300">{title}</h2>
        
        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Batch Name/ID
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Batch Name/ID"
              required
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date
            </label>
            <input
              name="date"
              type="datetime-local"
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Source Fermentation Batch
            </label>
            <select
              name="fermentationId"
              value={formData.fermentationId}
              onChange={handleChange}
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="">-- Select Source Fermentation --</option>
              {fermentationBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchName} ({batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'No date'})
                </option>
              ))}
              <option value="storage_tank">Use Storage Tank</option>
            </select>
          </div>

          {/* Distillation Charge Section */}
          <div className="border border-gray-600 rounded p-4 bg-gray-750">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">Distillation Charge</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Input Method</label>
                <select
                  name="chargeInputMethod"
                  value={formData.chargeInputMethod}
                  onChange={handleChange}
                  className="w-full bg-gray-700 p-2 rounded"
                >
                  <option value="weight">Weight (lbs)</option>
                  <option value="wineGallons">Wine Gallons</option>
                  <option value="proofGallons">Proof Gallons</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proof</label>
                <input
                  name="chargeProof"
                  type="number"
                  step="0.1"
                  value={formData.chargeProof}
                  onChange={handleChange}
                  placeholder="Charge Proof"
                  className="w-full bg-gray-700 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Temperature (°F)</label>
                <input
                  name="chargeTemperature"
                  type="number"
                  step="1"
                  value={formData.chargeTemperature}
                  onChange={handleChange}
                  placeholder="68"
                  className="w-full bg-gray-700 p-2 rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                {formData.chargeInputMethod === "weight" && (
                  <label className="block text-sm font-medium text-gray-300 mb-1">Weight (lbs)</label>
                )}
                {formData.chargeInputMethod === "wineGallons" && (
                  <label className="block text-sm font-medium text-gray-300 mb-1">Wine Gallons</label>
                )}
                {formData.chargeInputMethod === "proofGallons" && (
                  <label className="block text-sm font-medium text-gray-300 mb-1">Proof Gallons</label>
                )}
                {formData.chargeInputMethod === "weight" && (
                  <input
                    name="chargeWeight"
                    type="number"
                    step="0.001"
                    value={formData.chargeWeight}
                    onChange={handleChange}
                    placeholder="Enter weight"
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                )}
                {formData.chargeInputMethod === "wineGallons" && (
                  <input
                    name="chargeWineGallonsInput"
                    type="number"
                    step="0.001"
                    value={chargeWineGallonsInput}
                    onChange={handleChange}
                    placeholder="Enter wine gallons"
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                )}
                {formData.chargeInputMethod === "proofGallons" && (
                  <input
                    name="chargeProofGallonsInput"
                    type="number"
                    step="0.001"
                    value={chargeProofGallonsInput}
                    onChange={handleChange}
                    placeholder="Enter proof gallons"
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                )}
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-sm text-gray-400">
                  <div>Net Weight: {chargeCalculated.netWeightLbs.toFixed(2)} lbs</div>
                  <div>Wine Gallons: {chargeCalculated.wineGallons.toFixed(2)} gal</div>
                  <div>Proof Gallons: {chargeCalculated.proofGallons.toFixed(2)} PG</div>
                </div>
              </div>
            </div>
          </div>

          {/* Distillation Yield Section */}
          <div className="border border-gray-600 rounded p-4 bg-gray-750">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">Distillation Yield</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Input Method</label>
                <select
                  name="yieldInputMethod"
                  value={formData.yieldInputMethod}
                  onChange={handleChange}
                  className="w-full bg-gray-700 p-2 rounded"
                >
                  <option value="weight">Weight (lbs)</option>
                  <option value="wineGallons">Wine Gallons</option>
                  <option value="proofGallons">Proof Gallons</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proof</label>
                <input
                  name="yieldProof"
                  type="number"
                  step="0.1"
                  value={formData.yieldProof}
                  onChange={handleChange}
                  placeholder="Yield Proof"
                  className="w-full bg-gray-700 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Temperature (°F)</label>
                <input
                  name="yieldTemperature"
                  type="number"
                  step="1"
                  value={formData.yieldTemperature}
                  onChange={handleChange}
                  placeholder="68"
                  className="w-full bg-gray-700 p-2 rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                {formData.yieldInputMethod === "weight" && (
                  <label className="block text-sm font-medium text-gray-300 mb-1">Weight (lbs)</label>
                )}
                {formData.yieldInputMethod === "wineGallons" && (
                  <label className="block text-sm font-medium text-gray-300 mb-1">Wine Gallons</label>
                )}
                {formData.yieldInputMethod === "proofGallons" && (
                  <label className="block text-sm font-medium text-gray-300 mb-1">Proof Gallons</label>
                )}
                {formData.yieldInputMethod === "weight" && (
                  <input
                    name="yieldWeight"
                    type="number"
                    step="0.001"
                    value={formData.yieldWeight}
                    onChange={handleChange}
                    placeholder="Enter weight"
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                )}
                {formData.yieldInputMethod === "wineGallons" && (
                  <input
                    name="yieldWineGallonsInput"
                    type="number"
                    step="0.001"
                    value={yieldWineGallonsInput}
                    onChange={handleChange}
                    placeholder="Enter wine gallons"
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                )}
                {formData.yieldInputMethod === "proofGallons" && (
                  <input
                    name="yieldProofGallonsInput"
                    type="number"
                    step="0.001"
                    value={yieldProofGallonsInput}
                    onChange={handleChange}
                    placeholder="Enter proof gallons"
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                )}
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-sm text-gray-400">
                  <div>Net Weight: {yieldCalculated.netWeightLbs.toFixed(2)} lbs</div>
                  <div>Wine Gallons: {yieldCalculated.wineGallons.toFixed(2)} gal</div>
                  <div>Proof Gallons: {yieldCalculated.proofGallons.toFixed(2)} PG</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Store Yield In Container</label>
              <select
                name="storeYieldContainer"
                value={formData.storeYieldContainer}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 p-2 rounded"
              >
                <option value="">-- Select Empty Container --</option>
                {containers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.name} ({container.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Product Type
            </label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes..."
              rows="2"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 py-2 px-4 rounded"
            >
              Save Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
