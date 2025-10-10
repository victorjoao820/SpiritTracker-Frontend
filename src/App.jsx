import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthScreen from "./AuthScreen";
import { InventoryItem } from "./components/InventoryItem";
import { ProductionView } from "./components/ProductionView";
import { APP_NAME, DEFAULT_PRODUCTS, TRANSACTION_TYPES } from "./constants";
import { AddEditContainerModal, AddEditProductionModal, ConfirmationModal } from "./components/modals";
import { productsAPI, containersAPI, productionAPI, transactionsAPI, containerOperationsAPI } from "./services/api";

// Main App Content Component
function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  
  // State management
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [productionBatches, setProductionBatches] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingProduction, setIsLoadingProduction] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [formModalMode, setFormModalMode] = useState("add");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [editingProductionBatch, setEditingProductionBatch] = useState(null);
  const [currentView, setCurrentView] = useState("inventory");

  // Data fetching functions
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const fetchedProducts = await productsAPI.getAll();
      
      if (fetchedProducts.length === 0) {
        await productsAPI.bulkCreate(DEFAULT_PRODUCTS);
        const reseededProducts = await productsAPI.getAll();
        setProducts(reseededProducts);
      } else {
        setProducts(fetchedProducts);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setIsLoadingInventory(true);
      const fetchedInventory = await containersAPI.getAll();
      setInventory(fetchedInventory);
      setError("");
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to fetch inventory.");
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const fetchProductionBatches = async () => {
    try {
      setIsLoadingProduction(true);
      const fetchedBatches = await productionAPI.getAll();
      setProductionBatches(fetchedBatches);
      setError("");
    } catch (err) {
      console.error("Error fetching production batches:", err);
      setError("Failed to fetch production batches.");
    } finally {
      setIsLoadingProduction(false);
    }
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProducts();
      fetchInventory();
      fetchProductionBatches();
    }
  }, [isAuthenticated, user]);

  // Container operations
  const handleAddContainer = async (containerData) => {
    try {
      const newContainer = await containersAPI.create(containerData);
      setInventory(prev => [...prev, newContainer]);
      setError("");
    } catch (err) {
      console.error("Error adding container:", err);
      setError("Failed to add container.");
    }
  };

  const handleUpdateContainer = async (id, containerData) => {
    try {
      const updatedContainer = await containersAPI.update(id, containerData);
      setInventory(prev => prev.map(container => 
        container.id === id ? updatedContainer : container
      ));
      setError("");
    } catch (err) {
      console.error("Error updating container:", err);
      setError("Failed to update container.");
    }
  };

  const handleDeleteContainer = async (id) => {
    try {
      await containersAPI.delete(id);
      setInventory(prev => prev.filter(container => container.id !== id));
      setError("");
    } catch (err) {
      console.error("Error deleting container:", err);
      setError("Failed to delete container.");
    }
  };

  // Production operations
  const handleAddProductionBatch = async (batchData) => {
    try {
      const newBatch = await productionAPI.create(batchData);
      setProductionBatches(prev => [...prev, newBatch]);
      setError("");
    } catch (err) {
      console.error("Error adding production batch:", err);
      setError("Failed to add production batch.");
    }
  };

  const handleUpdateProductionBatch = async (id, batchData) => {
    try {
      const updatedBatch = await productionAPI.update(id, batchData);
      setProductionBatches(prev => prev.map(batch => 
        batch.id === id ? updatedBatch : batch
      ));
      setError("");
    } catch (err) {
      console.error("Error updating production batch:", err);
      setError("Failed to update production batch.");
    }
  };

  const handleDeleteProductionBatch = async (id) => {
    try {
      await productionAPI.delete(id);
      setProductionBatches(prev => prev.filter(batch => batch.id !== id));
      setError("");
    } catch (err) {
      console.error("Error deleting production batch:", err);
      setError("Failed to delete production batch.");
    }
  };

  // Container operations
  const handleTransfer = async (transferData) => {
    try {
      const result = await containerOperationsAPI.transfer(transferData);
      // Refresh inventory to get updated containers
      await fetchInventory();
      setError("");
    } catch (err) {
      console.error("Error transferring spirit:", err);
      setError("Failed to transfer spirit.");
    }
  };

  const handleProofDown = async (proofDownData) => {
    try {
      const result = await containerOperationsAPI.proofDown(proofDownData);
      // Refresh inventory to get updated container
      await fetchInventory();
      setError("");
    } catch (err) {
      console.error("Error proofing down:", err);
      setError("Failed to proof down.");
    }
  };

  const handleAdjustContents = async (adjustmentData) => {
    try {
      const result = await containerOperationsAPI.adjust(adjustmentData);
      // Refresh inventory to get updated container
      await fetchInventory();
      setError("");
    } catch (err) {
      console.error("Error adjusting contents:", err);
      setError("Failed to adjust contents.");
    }
  };

  const handleBottle = async (bottlingData) => {
    try {
      const result = await containerOperationsAPI.bottle(bottlingData);
      // Refresh inventory to get updated container
      await fetchInventory();
      setError("");
    } catch (err) {
      console.error("Error bottling:", err);
      setError("Failed to bottle spirit.");
    }
  };

  const handleChangeAccount = async (accountData) => {
    try {
      const result = await containerOperationsAPI.changeAccount(accountData);
      // Refresh inventory to get updated container
      await fetchInventory();
      setError("");
    } catch (err) {
      console.error("Error changing account:", err);
      setError("Failed to change account.");
    }
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">{APP_NAME}</h1>
              <span className="ml-4 text-sm text-gray-400">
                Welcome, {user?.email}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView("inventory")}
              className={`px-4 py-2 rounded-lg ${
                currentView === "inventory"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setCurrentView("production")}
              className={`px-4 py-2 rounded-lg ${
                currentView === "production"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Production
            </button>
          </div>

          <div className="flex space-x-2">
            {currentView === "inventory" && (
              <button
                onClick={() => {
                  setFormModalMode("add");
                  setEditingContainer(null);
                  setShowFormModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Add Container
              </button>
            )}
            {currentView === "production" && (
              <button
                onClick={() => {
                  setEditingProductionBatch(null);
                  setShowProductionModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Add Production Batch
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {currentView === "inventory" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingInventory ? (
              <div className="col-span-full text-center py-8">
                Loading inventory...
              </div>
            ) : inventory.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                No containers found. Add your first container to get started.
              </div>
            ) : (
              inventory.map((container) => (
                <InventoryItem
                  key={container.id}
                  container={container}
                  products={products}
                  onEdit={(container) => {
                    setEditingContainer(container);
                    setFormModalMode("edit");
                    setShowFormModal(true);
                  }}
                  onDelete={(container) => {
                    setItemToDelete(container);
                    setShowConfirmModal(true);
                  }}
                />
              ))
            )}
          </div>
        ) : (
          <ProductionView
          batches={productionBatches}
            isLoading={isLoadingProduction}
            onEdit={(batch) => {
              setEditingProductionBatch(batch);
              setShowProductionModal(true);
            }}
            onDelete={(batch) => {
              setItemToDelete(batch);
              setShowConfirmModal(true);
            }}
          />
        )}

        {/* Modals */}
        {showFormModal && (
          <AddEditContainerModal
            isOpen={showFormModal}
            onClose={() => setShowFormModal(false)}
            mode={formModalMode}
            container={editingContainer}
            products={products}
            onSave={formModalMode === "add" ? handleAddContainer : (id, data) => handleUpdateContainer(editingContainer.id, data)}
          />
        )}

        {showProductionModal && (
          <AddEditProductionModal
            isOpen={showProductionModal}
            onClose={() => setShowProductionModal(false)}
            mode={editingProductionBatch ? "edit" : "add"}
            batch={editingProductionBatch}
            products={products}
            batchType="production"
            onSave={editingProductionBatch ? (id, data) => handleUpdateProductionBatch(editingProductionBatch.id, data) : handleAddProductionBatch}
          />
        )}

        {showConfirmModal && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={() => {
              if (itemToDelete) {
                if (currentView === "inventory") {
                  handleDeleteContainer(itemToDelete.id);
                } else {
                  handleDeleteProductionBatch(itemToDelete.id);
                }
                setItemToDelete(null);
              }
              setShowConfirmModal(false);
            }}
            title="Confirm Delete"
            message={`Are you sure you want to delete this ${currentView === "inventory" ? "container" : "production batch"}?`}
          />
        )}
      </main>
    </div>
  );
}

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;