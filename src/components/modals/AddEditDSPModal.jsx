import { useState, useEffect } from "react";
import { dspsAPI } from "../../services/api";

export const AddEditDSPModal = ({ isOpen, onClose, onSave, mode = "add", dsp = null }) => {
  const [dsps, setDsps] = useState([]);
  const [dspName, setDspName] = useState("");
  const [dspDescription, setDspDescription] = useState("");
  const [editingDSP, setEditingDSP] = useState(null);
  const [formError, setFormError] = useState("");

  // Fetch existing DSPs
  useEffect(() => {
    if (isOpen) {
      fetchDSPs();
    }
  }, [isOpen]);

  // Handle external edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && dsp) {
      setEditingDSP(dsp);
      setDspName(dsp.name);
      setDspDescription(dsp.description || "");
      setFormError("");
    } else if (isOpen && mode === "add") {
      // Reset form for add mode
      setEditingDSP(null);
      setDspName("");
      setDspDescription("");
      setFormError("");
    }
  }, [isOpen, mode, dsp]);

  const fetchDSPs = async () => {
    try {
      const data = await dspsAPI.getAll();
      setDsps(data);
    } catch (err) {
      console.error("Failed to fetch DSPs", err);
    }
  };

  const handleAddDSP = async () => {
    if (!dspName.trim()) {
      setFormError("DSP name is required.");
      return;
    }
    try {
      const newDSP = await dspsAPI.create({
        name: dspName,
        description: dspDescription,
      });
      setDsps(prev => [...prev, newDSP]);
      setDspName("");
      setDspDescription("");
      setFormError("");
      
      // Call the parent's onSave callback to update the parent component
      if (onSave) {
        onSave(newDSP);
      }
    } catch (err) {
      console.error("Add DSP error:", err);
      setFormError("Failed to add DSP.");
    }
  };

  const handleEditDSP = (dsp) => {
    setEditingDSP(dsp);
    setDspName(dsp.name);
    setDspDescription(dsp.description || "");
    setFormError("");
  };

  const handleCancelEdit = () => {
    setEditingDSP(null);
    setDspName("");
    setDspDescription("");
    setFormError("");
  };

  const handleSaveChanges = async () => {
    if (!dspName.trim()) {
      setFormError("DSP name is required.");
      return;
    }
    try {
      const updatedDSP = await dspsAPI.update(editingDSP.id, {
        name: dspName,
        description: dspDescription,
      });
      setDsps(prev =>
        prev.map(d => (d.id === updatedDSP.id ? updatedDSP : d))
      );
      handleCancelEdit();
      
      // Call the parent's onSave callback to update the parent component
      if (onSave) {
        onSave(updatedDSP);
      }
    } catch (err) {
      console.error("Save changes error:", err);
      setFormError("Failed to save changes.");
    }
  };

  const handleDeleteDSP = async (id) => {
    try {
      await dspsAPI.delete(id);
      setDsps(prev => prev.filter(d => d.id !== id));
      if (editingDSP?.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Delete DSP error:", err);
      setFormError("Failed to delete DSP.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-semibold mb-6 text-blue-300">
          {mode === "edit" ? "Edit DSP" : "Manage DSPs"}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="newDSPName" className="block text-sm font-medium text-gray-300">DSP Name</label>
            <input
              id="newDSPName"
              placeholder="Enter DSP Name"
              value={dspName}
              onChange={(e) => setDspName(e.target.value)}
              className="mt-1 w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              type="text"
            />
          </div>
          <div>
            <label htmlFor="newDSPDescription" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="newDSPDescription"
              placeholder="Enter DSP description"
              rows="3"
              value={dspDescription}
              onChange={(e) => setDspDescription(e.target.value)}
              className="mt-1 w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            {!editingDSP ? (
              <button
                onClick={handleAddDSP}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Add DSP
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md"
                >
                  Cancel Edit
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        <hr className="my-4 border-gray-700" />

        {/* Existing DSPs */}
        <div className="flex-grow overflow-y-auto pr-2">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Existing DSPs:</h3>
          <ul className="space-y-3">
            {dsps.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-4 bg-gray-700 p-3 rounded-md">
                <div className="flex-1">
                  <p className="text-gray-100 font-semibold">{d.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{d.description}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                  <button
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold uppercase"
                    onClick={() => handleEditDSP(d)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400 text-xs font-semibold uppercase"
                    onClick={() => handleDeleteDSP(d.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

