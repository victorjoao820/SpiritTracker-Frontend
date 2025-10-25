import { useEffect, useState } from "react";

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

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && batch) {
      setFormData({
        name: batch.batchName || "",
        date: batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : "",
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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Basic validation
    if (!formData.name.trim()) {
      setFormError("Batch Name/ID is required");
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
              type="date"
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Weight (lbs)</label>
                <input
                  name="chargeWeight"
                  type="number"
                  step="0.001"
                  value={formData.chargeWeight}
                  onChange={handleChange}
                  placeholder="Enter weight"
                  className="w-full bg-gray-700 p-2 rounded"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-sm text-gray-400">
                  <div>Net Weight: 0.00 lbs</div>
                  <div>Wine Gallons: 0.00 gal</div>
                  <div>Proof Gallons: 0.00 PG</div>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Weight (lbs)</label>
                <input
                  name="yieldWeight"
                  type="number"
                  step="0.001"
                  value={formData.yieldWeight}
                  onChange={handleChange}
                  placeholder="Enter weight"
                  className="w-full bg-gray-700 p-2 rounded"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-sm text-gray-400">
                  <div>Net Weight: 0.00 lbs</div>
                  <div>Wine Gallons: 0.00 gal</div>
                  <div>Proof Gallons: 0.00 PG</div>
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
