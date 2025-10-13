import React, { useState, useEffect } from 'react';
import { InventoryItem } from './InventoryItem';
import { AddEditContainerModal, ConfirmationModal } from './modals';
import { containersAPI, productsAPI } from '../services/api';

const InventoryView = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedInventory, fetchedProducts] = await Promise.all([
        containersAPI.getAll(),
        productsAPI.getAll()
      ]);
      setInventory(fetchedInventory);
      setProducts(fetchedProducts);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch inventory data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContainer = async (containerData) => {
    try {
      const newContainer = await containersAPI.create(containerData);
      setInventory(prev => [...prev, newContainer]);
      setShowFormModal(false);
      setError('');
    } catch (err) {
      console.error('Error adding container:', err);
      setError('Failed to add container.');
      throw err;
    }
  };

  const handleUpdateContainer = async (id, containerData) => {
    try {
      const updatedContainer = await containersAPI.update(id, containerData);
      setInventory(prev =>
        prev.map(container => (container.id === id ? updatedContainer : container))
      );
      setShowFormModal(false);
      setEditingContainer(null);
      setError('');
    } catch (err) {
      console.error('Error updating container:', err);
      setError('Failed to update container.');
      throw err;
    }
  };

  const handleDeleteContainer = async (id) => {
    try {
      await containersAPI.delete(id);
      setInventory(prev => prev.filter(container => container.id !== id));
      setShowConfirmModal(false);
      setItemToDelete(null);
      setError('');
    } catch (err) {
      console.error('Error deleting container:', err);
      setError('Failed to delete container.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Container Inventory</h3>
          <p className="text-sm text-gray-400">
            Manage your distillery containers and barrels
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContainer(null);
            setShowFormModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Container
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Inventory Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading inventory...</div>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <p className="text-gray-400 mb-4">No containers found</p>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Container
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((container) => (
            <InventoryItem
              key={container.id}
              container={container}
              products={products}
              onEdit={(container) => {
                setEditingContainer(container);
                setShowFormModal(true);
              }}
              onDelete={(container) => {
                setItemToDelete(container);
                setShowConfirmModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <AddEditContainerModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingContainer(null);
          }}
          mode={editingContainer ? 'edit' : 'add'}
          container={editingContainer}
          products={products}
          onSave={
            editingContainer
              ? (id, data) => handleUpdateContainer(editingContainer.id, data)
              : handleAddContainer
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
              handleDeleteContainer(itemToDelete.id);
            }
          }}
          title="Confirm Delete"
          message="Are you sure you want to delete this container?"
        />
      )}
    </div>
  );
};

export default InventoryView;

