import React, { useState, useEffect } from 'react';
import { AddEditDistillationModal, ConfirmationModal } from '../modals';
import { distillationAPI, fermentationAPI, containersAPI, productsAPI } from '../../services/api';
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";

const DistillationView = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [fermentationBatches, setFermentationBatches] = useState([]);
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(batches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatches = batches.slice(startIndex, endIndex);
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  useEffect(() => {
    fetchData();
  }, []);
 
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedBatches, fetchedProducts, fetchedFermentationBatches, fetchedContainers] = await Promise.all([
        distillationAPI.getAll(),
        productsAPI.getAll(),
        fermentationAPI.getAll(),
        containersAPI.getAll()
      ]);

      
      // Filter containers to only show empty ones (status = EMPTY or netWeight = 0)
      const emptyContainers = fetchedContainers.filter(container => 
        container.status === 'EMPTY' || container.netWeight === 0 || !container.netWeight
      );

      setBatches(fetchedBatches);
      setProducts(fetchedProducts);
      setFermentationBatches(fetchedFermentationBatches);
      setContainers(emptyContainers);
      setError('');

    } catch (err) {
      console.error('Error fetching distillation data:', err);
      setError('Failed to fetch distillation data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBatch = async (batchData) => {
    try {
      const newBatch = await distillationAPI.create(batchData);
      setBatches(prev => [...prev, newBatch]);
      setShowModal(false);
      setError('');
    } catch (err) {
      console.error('Error adding production batch:', err);
      setError('Failed to add production batch.');
      throw err;
    }
  };

  const handleUpdateBatch = async (id, batchData) => {
    try {
      const updatedBatch = await distillationAPI.update(id, batchData);
      setBatches(prev =>
        prev.map(batch => (batch.id === id ? updatedBatch : batch))
      );
      setShowModal(false);
      setEditingBatch(null);
      setError('');
    } catch (err) {
      console.error('Error updating production batch:', err);
      setError('Failed to update production batch.');
      throw err;
    }
  };

  const handleDeleteBatch = async (id) => {
    try {
      await distillationAPI.delete(id);
      setBatches(prev => prev.filter(batch => batch.id !== id));
      setShowConfirmModal(false);
      setItemToDelete(null);
      setError('');
      
      // Reset to first page if current page becomes empty
      const remainingBatches = batches.filter((batch) => batch.id !== id);
      const newTotalPages = Math.ceil(remainingBatches.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error('Error deleting distillation batch:', err);
      setError('Failed to delete distillation batch.');
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Distillation Batches
          </h3>
          <p className="text-sm text-gray-400">
            Manage your distillation batches and spirit production
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBatch(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Distillation Batch
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Distillation Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading distillation batches...</div>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <p className="text-gray-400 mb-4">No distillation batches found</p>
          <button
            onClick={() => {
              setEditingBatch(null);
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Batch
          </button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    #
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Batch Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Source Batch
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Yield Container
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Charge Proof
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Yield Proof
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentBatches.map((batch, index) => (
                  <tr key={batch.id} className="transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {batch.batchName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.fermentationId ? batch.fermentation?.batchName : 'Storage Tank'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.storeYieldContainer ? batch.container.name : 'Storage Tank'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.chargeProof ? batch.chargeProof : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.yieldProof ? batch.yieldProof : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        batch.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : batch.status === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {/* Edit and Delete Buttons */}
                      <div className="flex justify-center">
                        <ActionButtons
                          onEdit={() => {
                            setEditingBatch(batch);
                            setShowModal(true);}}
                          onDelete={() => {
                            setItemToDelete(batch);
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
            totalItems={batches.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AddEditDistillationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBatch(null);
          }}
          mode={editingBatch ? 'edit' : 'add'}
          batch={editingBatch}
          products={products}
          fermentationBatches={fermentationBatches}
          containers={containers}
          onSave={
            editingBatch
              ? (data) => handleUpdateBatch(editingBatch.id, data)
              : handleAddBatch
          }
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this distillation batch?"
          onCancel={() => {
            setShowConfirmModal(false);
            setItemToDelete(null);
          }}
          onConfirm={() => {
            if (itemToDelete) {
              handleDeleteBatch(itemToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default DistillationView;

