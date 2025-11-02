import React, { useState, useEffect } from "react";
import { containerKindsAPI } from "../../services/api";

export const AddEditContainerTypeModal = ({
  isOpen,
  onClose,
  mode,
  containerType,
  onSave,
}) => {
  const isEditMode = mode === "edit";
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    tareWeight: "",
    totalVolume: "",
    description: "",
  });
  
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (containerType && isOpen) {
      setFormData({
        name: containerType.name || "",
        type: containerType.type || "",
        tareWeight: containerType.tareWeight?.toString() || "",
        totalVolume: containerType.totalVolume?.toString() || "",
        description: containerType.description || "",
      });
    } else if (isOpen && !isEditMode) {
      setFormData({
        name: "",
        type: "",
        tareWeight: "",
        totalVolume: "",
        description: "",
      });
    }
    setFormError("");
  }, [containerType, isOpen, isEditMode]);

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
      return "Container type name is required.";
    }
    if (!formData.type.trim()) {
      return "Container type identifier is required.";
    }
    const tareWeight = parseFloat(formData.tareWeight);
    if (isNaN(tareWeight) || tareWeight < 0) {
      return "Tare weight must be a valid number >= 0.";
    }
    const totalVolume = parseFloat(formData.totalVolume);
    if (isNaN(totalVolume) || totalVolume <= 0) {
      return "Total volume must be a valid number > 0.";
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
      const containerTypeData = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        tareWeight: parseFloat(formData.tareWeight),
        totalVolume: parseFloat(formData.totalVolume),
        description: formData.description.trim() || null,
      };

      let savedContainerKind;
      if (isEditMode && containerType?.id) {
        // Update existing container kind
        savedContainerKind = await containerKindsAPI.update(containerType.id, containerTypeData);
      } else {
        // Create new container kind
        savedContainerKind = await containerKindsAPI.create(containerTypeData);
      }

      // Call onSave callback with the saved data
      if (onSave) {
        onSave(savedContainerKind);
      }
      // Close modal after successful save
      onClose();
    } catch (err) {
      console.error("Error saving container kind:", err);
      setFormError(err.response?.data?.error || err.message || "Failed to save container kind.");
    }
  };

  if (!isOpen) return null;

  const title = isEditMode ? "Edit Container Type" : "Add Container Type";

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
              Container Type Name *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Wooden Barrel, Metal Drum"
              className="mt-1 w-full bg-gray-700 p-2 rounded text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-300"
            >
              Type *
            </label>
            <input
              id="type"
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              placeholder="e.g., barrel, drum, tank, tote"
              className="mt-1 w-full bg-gray-700 p-2 rounded text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-400">
              Container type (can be any text)
            </p>
          </div>

          <div>
            <label
              htmlFor="tareWeight"
              className="block text-sm font-medium text-gray-300"
            >
              Default Tare Weight (lbs) *
            </label>
            <input
              id="tareWeight"
              type="number"
              name="tareWeight"
              value={formData.tareWeight}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 120.5"
              className="mt-1 w-full bg-gray-700 p-2 rounded text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="totalVolume"
              className="block text-sm font-medium text-gray-300"
            >
              Total Volume (gallons) *
            </label>
            <input
              id="totalVolume"
              type="number"
              name="totalVolume"
              value={formData.totalVolume}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="e.g., 53"
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
              {isEditMode ? "Update" : "Add"} Container Type
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

