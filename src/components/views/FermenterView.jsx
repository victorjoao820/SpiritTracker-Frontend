import React, { useState, useEffect } from "react";
import { AddEditFermenterModal, ConfirmationModal } from "../modals";
import { fermentersAPI } from "../../services/api";
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";
import Button from "../ui/Button";
import { LiaCartPlusSolid } from "react-icons/lia";

const FermenterView = () => {
  const [fermenters, setFermenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddFermenterModal, setShowAddFermenterModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fermenterToDelete, setFermenterToDelete] = useState(null);
  const [editingFermenter, setEditingFermenter] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(fermenters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFermenters = fermenters.slice(startIndex, endIndex);
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  useEffect(() => {
    fetchFermenters();
  }, []);

  const fetchFermenters = async () => {
    try {
      setIsLoading(true);
      const fetchedFermenters = await fermentersAPI.getAll();
      setFermenters(fetchedFermenters);
      setError("");
    } catch (err) {
      console.error("Error fetching fermenters:", err);
      setError("Failed to fetch fermenters.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFermenter = async (savedFermenter) => {
    try {
      // The modal already saved to DB and closed, just update state
      setFermenters((prev) => [...prev, savedFermenter]);
      setEditingFermenter(null);
      setError("");
    } catch (err) {
      console.error("Error handling fermenter:", err);
      setError("Failed to update fermenter list.");
    }
  };

  const handleUpdateFermenter = async (savedFermenter) => {
    try {
      // The modal already saved to DB and closed, just update state
      setFermenters((prev) =>
        prev.map((fermenter) =>
          fermenter.id === savedFermenter.id ? savedFermenter : fermenter
        )
      );
      setEditingFermenter(null);
      setError("");
    } catch (err) {
      console.error("Error handling fermenter:", err);
      setError("Failed to update fermenter list.");
    }
  };

  const handleDeleteFermenter = async (id) => {
    try {
      await fermentersAPI.delete(id);
      setFermenters((prev) => prev.filter((fermenter) => fermenter.id !== id));
      setShowConfirmModal(false);
      setFermenterToDelete(null);
      setError("");
      
      // Reset to first page if current page becomes empty
      const remainingFermenters = fermenters.filter((fermenter) => fermenter.id !== id);
      const newTotalPages = Math.ceil(remainingFermenters.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Error deleting fermenter:", err);
      setError(err.response?.data?.error || "Failed to delete fermenter.");
    }
  };

  const handleEditFermenter = (fermenter) => {
    setEditingFermenter(fermenter);
    setShowAddFermenterModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
            Fermenters
          </h3>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Add or change fermenters.
          </p>
        </div>
        <Button
          onClick={() => setShowAddFermenterModal(true)}
          variant="default"
          icon={<LiaCartPlusSolid className="w-4 h-4 mr-2" />}
          >
          Add Fermenter
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Fermenters Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading fermenters...</div>
        </div>
      ) : fermenters.length === 0 ? (
        <div className="rounded-lg p-12 text-center border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="mb-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>No fermenters found</p>
          <Button
          onClick={() => setShowAddFermenterModal(true)}
          variant="default"
          icon={<LiaCartPlusSolid className="w-4 h-4 mr-2" />}
          >
          Add Your First Fermenter
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
                    Capacity Gallons
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
                {currentFermenters.map((fermenter, index) => (
                  <tr key={fermenter.id} className="transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {fermenter.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {fermenter.capacityGallons ? `${fermenter.capacityGallons} gal` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs truncate transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                        {fermenter.notes || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end pr-2 space-x-2">
                        <ActionButtons
                          onEdit={() => handleEditFermenter(fermenter)}
                          onDelete={() => {
                            setFermenterToDelete(fermenter);
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
            totalItems={fermenters.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modals */}
      {showAddFermenterModal && (
        <AddEditFermenterModal
          isOpen={showAddFermenterModal}
          onClose={() => {
            setShowAddFermenterModal(false);
            setEditingFermenter(null);
          }}
          mode={editingFermenter ? "edit" : "add"}
          fermenter={editingFermenter}
          onSave={editingFermenter ? handleUpdateFermenter : handleAddFermenter}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this fermenter?"
          onCancel={() => {
            setShowConfirmModal(false);
            setFermenterToDelete(null);
          }}
          onConfirm={() => {
            if (fermenterToDelete) {
              handleDeleteFermenter(fermenterToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default FermenterView;

