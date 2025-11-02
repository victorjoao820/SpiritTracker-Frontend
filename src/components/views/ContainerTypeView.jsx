import React, { useState, useEffect } from "react";
import { AddEditContainerTypeModal, ConfirmationModal } from "../modals";
import { containerKindsAPI } from "../../services/api";
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";
import Button from "../ui/Button";
import { CubeIcon } from "../icons/NavigationIcons";

const ContainerTypeView = () => {
  const [containerTypes, setContainerTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddContainerTypeModal, setShowAddContainerTypeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [containerTypeToDelete, setContainerTypeToDelete] = useState(null);
  const [editingContainerType, setEditingContainerType] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(containerTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContainerTypes = containerTypes.slice(startIndex, endIndex);
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  useEffect(() => {
    fetchContainerKinds();
  }, []);

  const fetchContainerKinds = async () => {
    try {
      setIsLoading(true);
      const fetchedContainerKinds = await containerKindsAPI.getAll();
      setContainerTypes(fetchedContainerKinds);
      setError("");
    } catch (err) {
      console.error("Error fetching container kinds:", err);
      setError("Failed to fetch container kinds.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContainerType = async (savedContainerKind) => {
    try {
      // The modal already saved to DB and closed, just update state
      setContainerTypes((prev) => [...prev, savedContainerKind]);
      setEditingContainerType(null);
      setError("");
    } catch (err) {
      console.error("Error handling container kind:", err);
      setError("Failed to update container kind list.");
    }
  };

  const handleUpdateContainerType = async (savedContainerKind) => {
    try {
      // The modal already saved to DB and closed, just update state
      setContainerTypes((prev) =>
        prev.map((ct) =>
          ct.id === savedContainerKind.id ? savedContainerKind : ct
        )
      );
      setEditingContainerType(null);
      setError("");
    } catch (err) {
      console.error("Error handling container kind:", err);
      setError("Failed to update container kind list.");
    }
  };

  const handleDeleteContainerType = async (id) => {
    try {
      await containerKindsAPI.delete(id);
      setContainerTypes((prev) => prev.filter((ct) => ct.id !== id));
      setShowConfirmModal(false);
      setContainerTypeToDelete(null);
      setError("");
      
      // Reset to first page if current page becomes empty
      const remainingTypes = containerTypes.filter((ct) => ct.id !== id);
      const newTotalPages = Math.ceil(remainingTypes.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Error deleting container kind:", err);
      setError("Failed to delete container kind.");
    }
  };

  const handleEditContainerType = (containerType) => {
    setEditingContainerType(containerType);
    setShowAddContainerTypeModal(true);
  };

  // Helper function to format tare weight
  const formatTareWeight = (tareWeight) => {
    if (!tareWeight && tareWeight !== 0) return "N/A";
    return `${parseFloat(tareWeight).toFixed(2)} lbs`;
  };

  // Helper function to format total volume
  const formatTotalVolume = (totalVolume) => {
    if (!totalVolume && totalVolume !== 0) return "N/A";
    return `${parseFloat(totalVolume).toFixed(2)} gal`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
            Container Types
          </h3>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Manage container type templates with their default tare weight and total volume.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingContainerType(null);
            setShowAddContainerTypeModal(true);
          }}
          variant="default"
          icon={<CubeIcon className="w-4 h-4 mr-2" />}
        >
          Add Container Type
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Container Types Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading container types...</div>
        </div>
      ) : containerTypes.length === 0 ? (
        <div className="rounded-lg p-12 text-center border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="mb-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>No container types found</p>
          <Button
            onClick={() => {
              setEditingContainerType(null);
              setShowAddContainerTypeModal(true);
            }}
            variant="default"
            icon={<CubeIcon className="w-4 h-4 mr-2" />}
          >
            Add Your First Container Type
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
                    Tare Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Total Volume
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentContainerTypes.map((containerType, index) => (
                  <tr key={containerType.id} className="transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {containerType.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                        {formatTareWeight(containerType.tareWeight)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                        {formatTotalVolume(containerType.totalVolume)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end pr-2 space-x-2">
                        <ActionButtons
                          onEdit={() => handleEditContainerType(containerType)}
                          onDelete={() => {
                            setContainerTypeToDelete(containerType);
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
            totalItems={containerTypes.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modals */}
      {showAddContainerTypeModal && (
        <AddEditContainerTypeModal
          isOpen={showAddContainerTypeModal}
          onClose={() => {
            setShowAddContainerTypeModal(false);
            setEditingContainerType(null);
            setError("");
          }}
          mode={editingContainerType ? "edit" : "add"}
          containerType={editingContainerType}
          onSave={editingContainerType ? handleUpdateContainerType : handleAddContainerType}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this container kind?"
          onCancel={() => {
            setShowConfirmModal(false);
            setContainerTypeToDelete(null);
          }}
          onConfirm={() => {
            if (containerTypeToDelete) {
              handleDeleteContainerType(containerTypeToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default ContainerTypeView;
