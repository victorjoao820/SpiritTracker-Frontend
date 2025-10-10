import { useEffect, useState } from "react";
import { TRANSACTION_TYPES } from "../../constants";

export const AddEditProductionModal = ({
  isOpen,
  onClose,
  mode,
  batch,
  products,
  batchType,
  onSave,
}) => {
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState({
    name: "",
    productType: "",
    date: new Date().toISOString().split("T")[0],
    endDate: "",
    volumeGallons: "",
    proof: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && batch) {
      setFormData({
        name: batch.batchNumber || "",
        productType: batch.product?.name || "",
        date: batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : "",
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().split("T")[0] : "",
        volumeGallons: batch.volumeGallons?.toString() || "",
        proof: batch.proof?.toString() || "",
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
      setFormError("Batch name is required");
      return;
    }

    if (!formData.productType) {
      setFormError("Product type is required");
      return;
    }

    try {
      // Prepare batch data for API
      const batchData = {
        batchType: batchType,
        productId: products.find(p => p.name === formData.productType)?.id || null,
        batchNumber: formData.name.trim(),
        startDate: formData.date || null,
        endDate: formData.endDate || null,
        volumeGallons: formData.volumeGallons ? parseFloat(formData.volumeGallons) : null,
        proof: formData.proof ? parseFloat(formData.proof) : null,
        notes: formData.notes.trim() || null
      };

      // Call the onSave function passed from parent
      await onSave(batchData);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      setFormError("Save failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  const title = isEdit ? `Edit ${batchType} Batch` : `Add ${batchType} Batch`;

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
              Product Type
            </label>
            <select
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Date
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
              End Date (Optional)
            </label>
            <input
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Volume (Gallons)
            </label>
            <input
              name="volumeGallons"
              type="number"
              step="0.01"
              value={formData.volumeGallons}
              onChange={handleChange}
              placeholder="Volume in gallons"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Proof
            </label>
            <input
              name="proof"
              type="number"
              step="0.1"
              value={formData.proof}
              onChange={handleChange}
              placeholder="Proof"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="3"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {isEdit ? "Update" : "Create"} Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};