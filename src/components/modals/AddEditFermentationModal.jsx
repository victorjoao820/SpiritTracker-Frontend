import { useEffect, useState } from "react";

export const AddEditFermentationModal = ({
  isOpen,
  onClose,
  mode,
  batch,
  onSave,
}) => {
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState({
    name: "",
    startDate: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
    startVolume: "",
    og: "",
    fg: "",
    ingredients: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && batch) {
      setFormData({
        name: batch.batchName || "",
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 16) : "",
        startVolume: batch.volumeGallons?.toString() || "",
        og: batch.startSG?.toString() || "",
        fg: batch.finalFG?.toString() || "",
        ingredients: batch.ingredient || "",
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

    try {
      // Prepare fermentation data for API
      const fermentationData = {
        batchName: formData.name.trim(),
        startDate: formData.startDate || null,
        volumeGallons: formData.startVolume ? parseFloat(formData.startVolume) : null,
        startSG: formData.og ? parseFloat(formData.og) : null,
        finalFG: formData.fg ? parseFloat(formData.fg) : null,
        ingredient: formData.ingredients.trim() || null,
        notes: formData.notes.trim() || null
      };

      // Call the onSave function passed from parent
      await onSave(fermentationData);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      setFormError("Save failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  const title = isEdit ? "Edit Fermentation" : "New Fermentation";

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
              Start Date & Time
            </label>
            <input
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Starting Volume (gal)
            </label>
            <input
              name="startVolume"
              type="number"
              step="0.01"
              value={formData.startVolume}
              onChange={handleChange}
              placeholder="Starting Volume (gal)"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Original Gravity
              </label>
              <input
                name="og"
                type="number"
                step="0.001"
                value={formData.og}
                onChange={handleChange}
                placeholder="Original Gravity"
                className="w-full bg-gray-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Final Gravity
              </label>
              <input
                name="fg"
                type="number"
                step="0.001"
                value={formData.fg}
                onChange={handleChange}
                placeholder="Final Gravity"
                className="w-full bg-gray-700 p-2 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ingredients
            </label>
            <textarea
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              placeholder="Ingredients..."
              rows="3"
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
