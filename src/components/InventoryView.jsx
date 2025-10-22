import React, { useState, useEffect } from "react";
import { AddEditContainerModal, ConfirmationModal, ProofDownModal } from "./modals";
import { containersAPI, productsAPI } from "../services/api";
import { CONTAINER_CAPACITIES_GALLONS } from "../constants";
import { calculateDerivedValuesFromWeight } from "../utils/helpers";


const InventoryView = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showProofDownModal, setShowProofDownModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState("");
  const [editingContainer, setEditingContainer] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(inventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContainers = inventory.slice(startIndex, endIndex);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedInventory, fetchedProducts] = await Promise.all([
        containersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setInventory(fetchedInventory);
      setProducts(fetchedProducts);
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch inventory data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContainer = async (containerData) => {
    try {
      const newContainer = await containersAPI.create(containerData);
      setInventory((prev) => [...prev, newContainer]);
      setShowFormModal(false);
      setError("");
    } catch (err) {
      console.error("Error adding container:", err);
      setError("Failed to add container.");
      throw err;
    }
  };

  const handleUpdateContainer = async (id, containerData) => {
    try {
      const updatedContainer = await containersAPI.update(id, containerData);
      setInventory((prev) =>
        prev.map((container) =>
          container.id === id ? updatedContainer : container
        )
      );
      setShowFormModal(false);
      setEditingContainer(null);
      setError("");
    } catch (err) {
      console.error("Error updating container:", err);
      setError("Failed to update container.");
      throw err;
    }
  };

  const handleDeleteContainer = async (id) => {
    try {
      await containersAPI.delete(id);
      setInventory((prev) => prev.filter((container) => container.id !== id));
      setShowConfirmModal(false);
      setItemToDelete(null);
      setError("");
      
      // Reset to first page if current page becomes empty
      const remainingContainers = inventory.filter((container) => container.id !== id);
      const newTotalPages = Math.ceil(remainingContainers.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Error deleting container:", err);
      setError("Failed to delete container.");
    }
  };

  const handleEditContainer = (container) => {
    const grossWeight = Number(container.netWeight) + Number(container.tareWeight);
    container.grossWeight = grossWeight.toFixed(2).toString();

    setEditingContainer(container);
    setShowFormModal(true);
  }

  const handleProofDown = (container) => {
    setEditingContainer(container);
    setShowProofDownModal(true);
  }

  const handleProofDownSave = async (proofDownData) => {
    try {
      // Call the proof down API with calculated values
      const response = await containersAPI.proofDown(proofDownData);

      if (!response.ok) {
        throw new Error('Proof down failed');
      }

      const updatedContainer = await response.json();
      
      // Update the inventory state
      setInventory((prev) =>
        prev.map((container) =>
          container.id === proofDownData.containerId ? updatedContainer : container
        )
      );
      
      setShowProofDownModal(false);
      setEditingContainer(null);
      setError("");
    } catch (err) {
      console.error("Error proofing down container:", err);
      setError("Failed to proof down container.");
      throw err;
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }
  
  // Helper function to calculate container data
  const calculateContainerData = (container) => {
    const capacity = CONTAINER_CAPACITIES_GALLONS[container.type] || 0;
    const netWeight = container.netWeight ? Number(container.netWeight) : 0;
    const proof = container.proof ? Number(container.proof) : 0;
    
    // Calculate percentage full based on net weight (simplified)
    let percentageFull = 0;
    if (container.type === "still") {
      percentageFull = container.status === "FILLED" ? 100 : 0;
    } else {
      percentageFull = container.status === "FILLED" && netWeight > 0 ? 100 : 0;
    }
    
    // Calculate proof gallons from net weight (assuming 8.3 lbs per gallon)
    
    
    // Get actual weights from container data
    const tareWeight = container.tareWeight ? Number(container.tareWeight) : 0;
    const grossWeight = tareWeight + netWeight;
    const {wineGallons, proofGallons} = calculateDerivedValuesFromWeight(tareWeight, grossWeight, proof);
    
    return {
      percentageFull: Math.min(100, Math.max(0, percentageFull)),
      proofGallons,
      tareWeight,
      grossWeight,
      netWeight,
      wineGallons
    };
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Container Inventory
          </h3>
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
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Containers Table */}
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
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Three-Part Table Structure */}
          <div className="flex">
            {/* Fixed Part 1: ID and Name */}
            <div className="flex-shrink-0">
              <div className="bg-gray-700 h-12">
                <div className="flex h-full">
                  <div className="w-12 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-600">
                    ID
                  </div>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-600">
                    Name
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 divide-y divide-gray-700">
                {currentContainers.map((container, index) => {
                  return (
                    <div key={container.id} className="flex hover:bg-gray-750 transition-colors h-16">
                      <div className="w-12 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300 border-r border-gray-600">
                        {startIndex + index + 1}
                      </div>
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap border-r border-gray-600">
                        <div className="text-center">
                          <div className="text-sm font-medium text-white">
                            {container.name || 'Unnamed'}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {container.type?.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Scrollable Part 2: Middle columns */}
            <div className="flex-1 overflow-x-auto">
              <div className="bg-gray-700 h-12">
                <div className="flex min-w-max h-full">
                  <div className="w-24 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Account
                  </div>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </div>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Product
                  </div>
                  <div className="w-24 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fill Date
                  </div>
                  <div className="w-20 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Proof
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tare Weight
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Gross Weight
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Net Weight
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Wine Gallons
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Proof Gallons
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 divide-y divide-gray-700">
                {currentContainers.map((container, index) => {
                  const calculated = calculateContainerData(container);
                  const product = products.find(p => p.id === container.productId);
                  
                  return (
                    <div key={container.id} className="flex hover:bg-gray-750 transition-colors h-16">
                      <div className="w-24 px-4 flex items-center justify-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium `}>
                          {container.account || 'Storage'}
                        </span>
                      </div>
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                container.status === 'FILLED' ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${calculated.percentageFull}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-300">
                            {container.status === 'FILLED' ? `${calculated.percentageFull.toFixed(0)}%` : 'Empty'}
                          </span>
                        </div>
                      </div>
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap">
                        <div className="text-sm text-gray-300 text-center">
                          {product?.name || 'No Product'}
                        </div>
                      </div>
                      <div className="w-24 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {container.fillDate ? new Date(container.fillDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="w-20 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {container.proof ? `${container.proof}°` : 'N/A'}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {calculated.tareWeight.toFixed(1)} lbs
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {calculated.grossWeight.toFixed(1)} lbs
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {calculated.netWeight.toFixed(1)} lbs
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {calculated.wineGallons.toFixed(2)} gal
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm font-medium text-blue-400">
                        {calculated.proofGallons.toFixed(2)} PG
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Fixed Part 3: Actions */}
            <div className="flex-shrink-0">
              <div className="bg-gray-700 h-12">
                <div className="w-48 px-4 flex items-center justify-center h-full text-xs font-medium text-gray-300 uppercase tracking-wider border-l border-gray-600">
                  Actions
                </div>
              </div>
              <div className="bg-gray-800 divide-y divide-gray-700">
                {currentContainers.map((container, index) => {
                  return (
                    <div key={container.id} className="hover:bg-gray-750 transition-colors h-16">
                      <div className="w-48 px-4 flex items-center justify-center whitespace-nowrap text-sm font-medium border-l border-gray-600 h-full">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditContainer(container)}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleProofDown(container)}
                            className="text-cyan-400 hover:text-cyan-300 font-medium"
                          >
                            Proof Down
                          </button>
                          <button
                            onClick={() => {
                setItemToDelete(container);
                setShowConfirmModal(true);
              }}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-600">
            {/* Items per page selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-400">per page</span>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <>
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
                      <span className="font-medium">{Math.min(endIndex, inventory.length)}</span> of{' '}
                      <span className="font-medium">{inventory.length}</span> results
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
              </>
            )}
          </div>
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
          mode={editingContainer ? "edit" : "add"}
          container={editingContainer}
          products={products}
          onSave={
            editingContainer
              ? (data) => handleUpdateContainer(editingContainer.id, data)
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

      {showProofDownModal && (
        <ProofDownModal
          isOpen={showProofDownModal}
          onClose={() => {
            setShowProofDownModal(false);
            setEditingContainer(null);
          }}
          container={editingContainer}
          onSave={handleProofDownSave}
        />
      )}
    </div>
  );
};

export default InventoryView;
