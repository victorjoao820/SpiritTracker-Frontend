import React, { useState, useEffect } from 'react';
import { ProductionList } from './ProductionList';
import { AddEditProductionModal, ConfirmationModal } from './modals';
import { productionAPI, productsAPI } from '../services/api';

const ProductionViewUpdated = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedBatches, fetchedProducts] = await Promise.all([
        productionAPI.getAll(),
        productsAPI.getAll()
      ]);
      setBatches(fetchedBatches);
      setProducts(fetchedProducts);
      setError('');
    } catch (err) {
      console.error('Error fetching production data:', err);
      setError('Failed to fetch production data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBatch = async (batchData) => {
    try {
      const newBatch = await productionAPI.create(batchData);
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
      const updatedBatch = await productionAPI.update(id, batchData);
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
      await productionAPI.delete(id);
      setBatches(prev => prev.filter(batch => batch.id !== id));
      setShowConfirmModal(false);
      setItemToDelete(null);
      setError('');
    } catch (err) {
      console.error('Error deleting production batch:', err);
      setError('Failed to delete production batch.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Production Batches</h3>
          <p className="text-sm text-gray-400">
            Track fermentation and distillation batches
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBatch(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Production Batch
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Production List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading production batches...</div>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <p className="text-gray-400 mb-4">No production batches found</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Batch
          </button>
        </div>
      ) : (
        <ProductionList
          batches={batches}
          onEdit={(batch) => {
            setEditingBatch(batch);
            setShowModal(true);
          }}
          onDelete={(batch) => {
            setItemToDelete(batch);
            setShowConfirmModal(true);
          }}
        />
      )}

      {/* Modals */}
      {showModal && (
        <AddEditProductionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBatch(null);
          }}
          mode={editingBatch ? 'edit' : 'add'}
          batch={editingBatch}
          products={products}
          batchType="production"
          onSave={
            editingBatch
              ? (id, data) => handleUpdateBatch(editingBatch.id, data)
              : handleAddBatch
          }
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setItemToDelete(null);
          }}
          onConfirm={() => {
            if (itemToDelete) {
              handleDeleteBatch(itemToDelete.id);
            }
          }}
          title="Confirm Delete"
          message="Are you sure you want to delete this production batch?"
        />
      )}
    </div>
  );
};

export default ProductionViewUpdated;

