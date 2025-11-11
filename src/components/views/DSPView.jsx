import React, { useState, useEffect } from "react";
import { AddEditDSPModal, ConfirmationModal } from "../modals";
import { dspsAPI } from "../../services/api";
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";
import Button from "../ui/Button";
import { LiaCartPlusSolid } from "react-icons/lia";

const DSPView = () => {
  const [dsps, setDsps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddDSPModal, setShowAddDSPModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dspToDelete, setDspToDelete] = useState(null);
  const [editingDSP, setEditingDSP] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(dsps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDsps = dsps.slice(startIndex, endIndex);
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  useEffect(() => {
    fetchDSPs();
  }, []);

  const fetchDSPs = async () => {
    try {
      setIsLoading(true);
      const fetchedDsps = await dspsAPI.getAll();
      setDsps(fetchedDsps);
      setError("");
    } catch (err) {
      console.error("Error fetching DSPs:", err);
      setError("Failed to fetch DSPs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDSP = async (dspData) => {
    try {
      // Check for duplicate name (case-insensitive) before adding
      const duplicateDSP = dsps.find(
        (dsp) => dsp.name.toLowerCase().trim() === dspData.name?.toLowerCase().trim()
      );
      
      if (duplicateDSP) {
        setError("A DSP with this name already exists. Please choose a different name.");
        setShowAddDSPModal(false);
        return;
      }

      // If dspData is already a DSP object (from modal callback), use it directly
      if (dspData.id) {
        setDsps((prev) => [...prev, dspData]);
        setShowAddDSPModal(false);
        setError("");
      } else {
        // If dspData is raw data, create the DSP
        const newDSP = await dspsAPI.create(dspData);
        // Double-check for duplicates after creation
        const stillDuplicate = dsps.find(
          (dsp) => dsp.name.toLowerCase().trim() === newDSP.name?.toLowerCase().trim()
        );
        if (stillDuplicate) {
          setError("A DSP with this name already exists. Please choose a different name.");
          setShowAddDSPModal(false);
          return;
        }
        setDsps((prev) => [...prev, newDSP]);
        setShowAddDSPModal(false);
        setError("");
      }
    } catch (err) {
      console.error("Error adding DSP:", err);
      const errorMessage = err.message || "Failed to add DSP.";
      setError(errorMessage);
      // Don't close modal on error so user can fix it
      setShowAddDSPModal(true);
      throw err;
    }
  };

  const handleDeleteDSP = async (id) => {
    try {
      await dspsAPI.delete(id);
      setDsps((prev) => prev.filter((dsp) => dsp.id !== id));
      setShowConfirmModal(false);
      setDspToDelete(null);
      setError("");
      
      // Reset to first page if current page becomes empty
      const remainingDsps = dsps.filter((dsp) => dsp.id !== id);
      const newTotalPages = Math.ceil(remainingDsps.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Error deleting DSP:", err);
      setError("Failed to delete DSP.");
    }
  };

  const handleEditDSP = (dsp) => {
    setEditingDSP(dsp);
    setShowAddDSPModal(true);
  };

  const handleUpdateDSP = async (dspData) => {
    try {
      // If dspData is already a DSP object (from modal callback), use it directly
      if (dspData.id) {
        setDsps((prev) =>
          prev.map((dsp) =>
            dsp.id === dspData.id ? dspData : dsp
          )
        );
        setShowAddDSPModal(false);
        setEditingDSP(null);
        setError("");
      } else {
        // If dspData is raw data, update the DSP
        const updatedDSP = await dspsAPI.update(editingDSP.id, dspData);
        setDsps((prev) =>
          prev.map((dsp) =>
            dsp.id === editingDSP.id ? updatedDSP : dsp
          )
        );
        setShowAddDSPModal(false);
        setEditingDSP(null);
        setError("");
      }
    } catch (err) {
      console.error("Error updating DSP:", err);
      setError("Failed to update DSP.");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
            DSP Management
          </h3>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Add or change DSPs.
          </p>
        </div>
        <Button
          onClick={() => setShowAddDSPModal(true)}
          variant="default"
          icon={<LiaCartPlusSolid className="w-4 h-4 mr-2" />}
          >
          Add DSP
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* DSPs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading DSPs...</div>
        </div>
      ) : dsps.length === 0 ? (
        <div className="rounded-lg p-12 text-center border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="mb-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>No DSPs found</p>
          <Button
          onClick={() => setShowAddDSPModal(true)}
          variant="default"
          icon={<LiaCartPlusSolid className="w-4 h-4 mr-2" />}
          >
          Add Your First DSP
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="transition-colors border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentDsps.map((dsp, index) => (
                  <tr key={dsp.id} className="transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {dsp.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs truncate transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                        {dsp.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end pr-2 space-x-2">
                        <ActionButtons
                          onEdit={() => handleEditDSP(dsp)}
                          onDelete={() => {
                            setDspToDelete(dsp);
                            setShowConfirmModal(true);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={dsps.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modals */}
      {showAddDSPModal && (
        <AddEditDSPModal
          isOpen={showAddDSPModal}
          onClose={() => {
            setShowAddDSPModal(false);
            setEditingDSP(null);
          }}
          mode={editingDSP ? "edit" : "add"}
          dsp={editingDSP}
          onSave={editingDSP ? handleUpdateDSP : handleAddDSP}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this DSP?"
          onCancel={() => {
            setShowConfirmModal(false);
            setDspToDelete(null);
          }}
          onConfirm={() => {
            if (dspToDelete) {
              handleDeleteDSP(dspToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default DSPView;

