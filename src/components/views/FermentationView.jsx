import React, { useState, useEffect } from 'react';
import { AddEditFermentationModal, ConfirmationModal } from '../modals';
import { fermentationAPI } from '../../services/api';
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";
import Button from "../ui/Button";
import { PiCirclesThreePlus } from "react-icons/pi";

const FermentationView = () => {
  const [batches, setBatches] = useState([]);
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
      const fetchedBatches = await fermentationAPI.getAll();
      setBatches(fetchedBatches);
      setError('');
    } catch (err) {
      console.error('Error fetching fermentation data:', err);
      setError('Failed to fetch fermentation data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBatch = async (batchData) => {
    try {
      const newBatch = await fermentationAPI.create(batchData);
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
      const updatedBatch = await fermentationAPI.update(id, batchData);
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
      await fermentationAPI.delete(id);
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
      console.error('Error deleting fermentation batch:', err);
      setError('Failed to delete fermentation batch.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            Fermentation Batches
          </h3>
          <p className="text-sm text-gray-400">
            Manage your fermentation batches and brewing process
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBatch(null);
            setShowModal(true);
          }}
          variant="default"
          icon={<PiCirclesThreePlus className="w-4 h-4 mr-2" />}
        >
          Fermentation Batch
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Fermentation Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading fermentation batches...</div>
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-lg p-12 text-center border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="mb-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>No fermentation batches found</p>
          <Button
          onClick={() => {  
            setEditingBatch(null);
            setShowModal(true);
          }}
            variant="default"
            icon={<PiCirclesThreePlus className="w-4 h-4 mr-2" />}
          >
          Add First Fermentation Batch
          </Button>
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
                    Volume (gal)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    OG
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    FG
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-center transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {batch.batchName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.startDate ? (
                        <div className="space-y-1">
                          <div>{new Date(batch.startDate).toLocaleDateString()}</div>
                          <div className="text-xs transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(batch.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.volumeGallons ? `${batch.volumeGallons}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.startSG ? batch.startSG : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {batch.finalFG ? batch.finalFG : 'N/A'}
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
        <AddEditFermentationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBatch(null);
          }}
          mode={editingBatch ? 'edit' : 'add'}
          batch={editingBatch}
          onSave={
            editingBatch
              ? (data) => handleUpdateBatch(editingBatch.id, data)
              : handleAddBatch
          }
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this fermentation batch?"
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

export default FermentationView;

