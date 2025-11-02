import { useState, useEffect } from "react";
import { fermentersAPI } from "../../services/api";

export const AddEditFermenterModal = ({ isOpen, onClose, onSave, mode = "add", fermenter = null }) => {
  const isEditMode = mode === "edit";
  
  const [formData, setFormData] = useState({
    name: "",
    capacityGallons: "",
    description: "",
  });
  
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (fermenter && isOpen) {
      setFormData({
        name: fermenter.name || "",
        capacityGallons: fermenter.capacityGallons?.toString() || "",
        description: fermenter.notes || "",
      });
    } else if (isOpen && !isEditMode) {
      setFormData({
        name: "",
        capacityGallons: "",
        description: "",
      });
    }
    setFormError("");
  }, [fermenter, isOpen, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Fermenter name is required.";
    }
    const capacityGallons = parseFloat(formData.capacityGallons);
    if (formData.capacityGallons && (isNaN(capacityGallons) || capacityGallons <= 0)) {
      return "Capacity gallons must be a valid number > 0.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");

    try {
      const fermenterData = {
        name: formData.name.trim(),
        capacityGallons: formData.capacityGallons ? parseFloat(formData.capacityGallons) : null,
        description: formData.description.trim() || null,
      };

      let savedFermenter;
      if (isEditMode && fermenter?.id) {
        // Update existing fermenter
        savedFermenter = await fermentersAPI.update(fermenter.id, fermenterData);
      } else {
        // Create new fermenter
        savedFermenter = await fermentersAPI.create(fermenterData);
      }

      // Call onSave callback with the saved data
      if (onSave) {
        onSave(savedFermenter);
      }
      // Close modal after successful save
      onClose();
    } catch (err) {
      console.error("Error saving fermenter:", err);
      setFormError(err.response?.data?.error || err.message || "Failed to save fermenter.");
    }
  };

  if (!isOpen) return null;

  const title = isEditMode ? "Edit Fermenter" : "Add Fermenter";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl mb-6 text-blue-300">{title}</h2>
        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300"
            >
              Fermenter Name *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Fermenter 1, Main Fermenter"
              className="mt-1 w-full bg-gray-700 p-2 rounded text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="capacityGallons"
              className="block text-sm font-medium text-gray-300"
            >
              Capacity (gallons)
            </label>
            <input
              id="capacityGallons"
              type="number"
              name="capacityGallons"
              value={formData.capacityGallons}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder="e.g., 500"
              className="mt-1 w-full bg-gray-700 p-2 rounded text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description"
              rows="3"
              className="mt-1 w-full bg-gray-700 p-2 rounded text-gray-100"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditMode ? "Update" : "Add"} Fermenter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

