import React, { useState, useEffect } from 'react';
import { AddEditDistillationModal, ConfirmationModal } from './modals';
import { distillationAPI, fermentationAPI, containersAPI, productsAPI } from '../services/api';

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
  const [itemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(batches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatches = batches.slice(startIndex, endIndex);

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
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Source Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Yield Container
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Charge Proof
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Yield Proof
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {currentBatches.map((batch, index) => (
                  <tr key={batch.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {batch.batchName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {batch.fermentationId ? batch.fermentation?.batchName : 'Storage Tank'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {batch.storeYieldContainer ? batch.storeYieldContainer : 'Storage Tank'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {batch.chargeProof ? batch.chargeProof : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {batch.yieldProof ? batch.yieldProof : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingBatch(batch);
                            setShowModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(batch);
                            setShowConfirmModal(true);
                          }}
                          className="text-red-400 hover:text-red-300 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-600">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, batches.length)}</span> of{' '}
                    <span className="font-medium">{batches.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show only a few page numbers around current page
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-800 border-gray-300 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-800 text-sm font-medium text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
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

