import React, { useState, useEffect } from "react";
import { AddEditContainerModal, ConfirmationModal, ProofDownModal, BottlingModal, TransferModal, AdjustContentsModal } from "../modals";
import { containersAPI, productsAPI, containerOperationsAPI } from "../../services/api";
import { CONTAINER_CAPACITIES_GALLONS } from "../../constants";
import { calculateDerivedValuesFromWeight, calculateSpiritDensity} from "../../utils/helpers";

const InventoryView = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showProofDownModal, setShowProofDownModal] = useState(false);
  const [showBottlingModal, setShowBottlingModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [error, setError] = useState("");
  const [editingContainer, setEditingContainer] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  // Track changed containers for highlighting
  const [changedContainerIds, setChangedContainerIds] = useState([]);
  const [previousValues, setPreviousValues] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sort inventory by fillDate in ascending order (oldest first)
  const sortedInventory = [...inventory].sort((a, b) => {
    const dateA = a.fillDate ? new Date(a.fillDate).getTime() : 0;
    const dateB = b.fillDate ? new Date(b.fillDate).getTime() : 0;
    
    // If neither has a fillDate, maintain original order
    if (!a.fillDate && !b.fillDate) return 0;
    
    // Items without fillDate go to the end
    if (!a.fillDate) return 1;
    if (!b.fillDate) return -1;
    
    // Sort by date ascending (oldest first)
    return dateA - dateB;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContainers = sortedInventory.slice(startIndex, endIndex);

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openDropdownId]);

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
      
      // Update the inventory and re-sort by fillDate
      setInventory((prev) => {
        const updated = prev.map((container) =>
          container.id === id ? updatedContainer : container
        );
        return updated.sort((a, b) => {
          const dateA = a.fillDate ? new Date(a.fillDate).getTime() : 0;
          const dateB = b.fillDate ? new Date(b.fillDate).getTime() : 0;
          
          if (!a.fillDate && !b.fillDate) return 0;
          if (!a.fillDate) return 1;
          if (!b.fillDate) return -1;
          
          return dateA - dateB;
        });
      });
      
      // Mark this container as changed (previousValues already set in handleEditContainer)
      setChangedContainerIds([id]);
      
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

    // Store previous values before editing
    const calculated = calculateContainerData(container);
    const product = products.find(p => p.id === container.productId);
    const prevValues = {
      name: container.name,
      type: container.type,
      account: container.account,
      fillDate: container.fillDate,
      proof: container.proof,
      tareWeight: container.tareWeight,
      netWeight: container.netWeight,
      grossWeight: calculated.grossWeight,
      wineGallons: calculated.wineGallons,
      proofGallons: calculated.proofGallons,
      productName: product?.name,
      productId: container.productId
    };
    
    setPreviousValues({ [container.id]: prevValues });
    setChangedContainerIds([]);
    
    setEditingContainer(container);
    setShowFormModal(true);
  }

  const handleProofDown = (container) => {
    setChangedContainerIds([]);
    setPreviousValues({});
    setEditingContainer(container);
    setShowProofDownModal(true);
  }

  const handleProofDownSave = async (proofDownData) => {
    try {
      // Store previous values before updating
      const previousContainer = inventory.find(c => c.id === proofDownData.containerId);
      const calculated = calculateContainerData(previousContainer);
      const prevValues = {
        proof: previousContainer?.proof,
        netWeight: previousContainer?.netWeight,
        grossWeight: calculated.grossWeight,
        wineGallons: calculated.wineGallons,
        proofGallons: calculated.proofGallons
      };
      
      // Call the proof down API with calculated values
      const updatedContainer = await containersAPI.proofDown(proofDownData);

      if (!updatedContainer.success) {
        throw new Error('Proof down failed');
      }
      
      // Update the inventory state and track changes
      setInventory((prev) =>
        prev.map((container) =>
          container.id === proofDownData.containerId ? updatedContainer : container
        )
      );
      
      // Clear previous changes and mark this container as changed
      setChangedContainerIds([proofDownData.containerId]);
      setPreviousValues({
        [proofDownData.containerId]: prevValues
      });
      
      setShowProofDownModal(false);
      setEditingContainer(null);
      setError("");
    } catch (err) {
      console.error("Error proofing down container:", err);
      setError("Failed to proof down container.");
      throw err;
    }
  }

  const handleBottle = (container) => {
    setChangedContainerIds([]);
    setPreviousValues({});
    setEditingContainer(container);
    setShowBottlingModal(true);
  }

  const handleBottlingSave = async (bottlingData) => {
    try {
      // Store previous values before updating
      const previousContainer = inventory.find(c => c.id === bottlingData.containerId);
      const calculated = calculateContainerData(previousContainer);
      const product = products.find(p => p.id === previousContainer?.productId);
      const prevValues = {
        netWeight: previousContainer?.netWeight,
        grossWeight: calculated.grossWeight,
        wineGallons: calculated.wineGallons,
        proofGallons: calculated.proofGallons,
        status: previousContainer?.status,
        productName: product?.name
      };
      
      // Call bottling API
      await containerOperationsAPI.bottle(bottlingData);
      await fetchData(); // Refresh inventory
      
      // Mark this container as changed with previous values
      setChangedContainerIds([bottlingData.containerId]);
      setPreviousValues({
        [bottlingData.containerId]: prevValues
      });
      
      setShowBottlingModal(false);
      setEditingContainer(null);
      setError("");
    } catch (err) {
      console.error("Error bottling container:", err);
      setError("Failed to bottle container.");
      throw err;
    }
  }

  const handleTransfer = (container) => {
    setChangedContainerIds([]);
    setPreviousValues({});
    setEditingContainer(container);
    setShowTransferModal(true);
  }

  const handleTransferSave = async (transferData) => {
    try {
      // Store previous values before updating
      const previousSource = inventory.find(c => c.id === transferData.sourceContainerId);
      const previousDest = inventory.find(c => c.id === transferData.destinationContainerId);
      const sourceCalculated = calculateContainerData(previousSource);
      const destCalculated = calculateContainerData(previousDest);
      const prevValues = {
        [transferData.sourceContainerId]: {
          netWeight: previousSource?.netWeight,
          grossWeight: sourceCalculated.grossWeight,
          wineGallons: sourceCalculated.wineGallons,
          proofGallons: sourceCalculated.proofGallons,
          status: previousSource?.status
        },
        [transferData.destinationContainerId]: {
          netWeight: previousDest?.netWeight,
          grossWeight: destCalculated.grossWeight,
          wineGallons: destCalculated.wineGallons,
          proofGallons: destCalculated.proofGallons,
          status: previousDest?.status
        }
      };
      
      // Call transfer API
      await containerOperationsAPI.transfer(transferData);
      await fetchData(); // Refresh inventory
      
      // Mark both containers as changed with previous values
      setChangedContainerIds([transferData.sourceContainerId, transferData.destinationContainerId]);
      setPreviousValues(prevValues);
      
      setShowTransferModal(false);
      setEditingContainer(null);
      setError("");
    } catch (err) {
      console.error("Error transferring container:", err);
      setError("Failed to transfer container.");
      throw err;
    }
  }

  const handleTankAdjust = (container) => {
    setChangedContainerIds([]);
    setPreviousValues({});
    setEditingContainer(container);
    setShowAdjustModal(true);
  }

  const handleAdjustSave = async (adjustData) => {
    try {
      // Store previous values before updating
      const previousContainer = inventory.find(c => c.id === adjustData.containerId);
      const calculated = calculateContainerData(previousContainer);
      const prevValues = {
        netWeight: previousContainer?.netWeight,
        grossWeight: calculated.grossWeight,
        wineGallons: calculated.wineGallons,
        proofGallons: calculated.proofGallons,
        status: previousContainer?.status
      };
      
      // Call adjust API
      await containerOperationsAPI.adjust(adjustData);
      await fetchData(); // Refresh inventory
      
      // Mark this container as changed with previous values
      setChangedContainerIds([adjustData.containerId]);
      setPreviousValues({
        [adjustData.containerId]: prevValues
      });
      
      setShowAdjustModal(false);
      setEditingContainer(null);
      setError("");
    } catch (err) {
      console.error("Error adjusting container:", err);
      setError("Failed to adjust container.");
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
    const temperatureFahrenheit = container.temperatureFahrenheit? Number(container.temperatureFahrenheit) : 60;
    // Calculate percentage full based on net weight (simplified)

    let percentageFull = 0;
    percentageFull = ((netWeight * 100) /(calculateSpiritDensity(proof, temperatureFahrenheit) *capacity)).toFixed(0);

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

  // Helper function to get changed value display
  const getChangedValueDisplay = (containerId, fieldName, currentValue, formatFn = (v) => v) => {
    if (!changedContainerIds.includes(containerId)) {
      return formatFn(currentValue);
    }
    
    const previousValue = previousValues[containerId]?.[fieldName];
    if (previousValue !== undefined && previousValue !== currentValue) {
      return (
        <span className="transition-all duration-500">
          <span className="text-yellow-300 line-through mr-2">{formatFn(previousValue)}</span>
          <span className="text-green-300 font-bold">→ {formatFn(currentValue)}</span>
        </span>
      );
    }
    return formatFn(currentValue);
  };

  // Check if container is changed
  const isChanged = (containerId) => changedContainerIds.includes(containerId);


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
      ) : sortedInventory.length === 0 ? (
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
          {/* Three Separate Tables That Look Like One */}
          <div className="flex">
            
            {/* Table 1: ID, Name, Account */}
            <div className="flex-shrink-0">
              <div className="bg-gray-700 h-12">
                <div className="flex h-full">
                  <div className="w-12 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-600">
                    ID
                  </div>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-600">
                    Name
                  </div>
                  <div className="w-24 px-4 flex items-center justify-center text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-600">
                    Account
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 divide-y divide-gray-700">
                {currentContainers.map((container, index) => {
                  return (
                    <div 
                      key={container.id} 
                      className={`flex hover:bg-gray-750 transition-all h-16 ${
                        isChanged(container.id) ? 'bg-yellow-900/30 animate-pulse' : ''
                      }`}
                    >
                      <div className="w-12 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300 border-r border-gray-600">
                        {startIndex + index + 1}
                      </div>
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap border-r border-gray-600">
                        <div className="text-center">
                          <div className="text-sm font-medium text-white">
                            {getChangedValueDisplay(
                              container.id,
                              'name',
                              container.name || 'Unnamed',
                              (v) => v || 'Unnamed'
                            )}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {getChangedValueDisplay(
                              container.id,
                              'type',
                              container.type,
                              (v) => v?.replace(/_/g, ' ') || ''
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-24 px-4 flex items-center justify-center whitespace-nowrap text-sm text-pink-300 border-r border-gray-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium `}>
                          {getChangedValueDisplay(
                            container.id,
                            'account',
                            container.account || 'Storage',
                            (v) => v || 'Storage'
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Table 2: Status, Product, Fill Date, Proof, Tare Weight, Gross Weight, Net Weight, Wine Gallons, Proof Gallons */}
            <div className="flex-1 overflow-x-auto">
              <div className="bg-gray-700 h-12">
                <div className="flex min-w-max h-full">
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
                    <div 
                      key={container.id} 
                      className={`flex hover:bg-gray-750 transition-all h-16 ${
                        isChanged(container.id) ? 'bg-yellow-900/30' : ''
                      }`}
                    >
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="w-8 bg-gray-200 h-2">
                            <div 
                              className={`h-2 ${
                                container.status === 'FILLED' ? 'bg-yellow-500' : 'bg-gray-400'
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
                          {getChangedValueDisplay(
                            container.id,
                            'productName',
                            product?.name || 'No Product',
                            (v) => v || 'No Product'
                          )}
                        </div>
                      </div>
                      <div className="w-24 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {getChangedValueDisplay(
                          container.id,
                          'fillDate',
                          container.fillDate,
                          (v) => v ? new Date(v).toLocaleDateString() : 'N/A'
                        )}
                      </div>
                      <div className="w-20 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {getChangedValueDisplay(
                          container.id,
                          'proof',
                          container.proof,
                          (v) => v ? `${v}°` : 'N/A'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {calculated.tareWeight.toFixed(1)} lbs
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {getChangedValueDisplay(
                          container.id,
                          'grossWeight',
                          calculated.grossWeight,
                          (v) => v.toFixed(1) + ' lbs'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {getChangedValueDisplay(
                          container.id,
                          'netWeight',
                          container.netWeight,
                          (v) => (v ? Number(v).toFixed(1) : '0.0') + ' lbs'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm text-gray-300">
                        {getChangedValueDisplay(
                          container.id,
                          'wineGallons',
                          calculated.wineGallons,
                          (v) => v.toFixed(2) + ' gal'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm font-medium text-blue-400">
                        {getChangedValueDisplay(
                          container.id,
                          'proofGallons',
                          calculated.proofGallons,
                          (v) => v.toFixed(2) + ' PG'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Table 3: Actions */}
            <div className="flex-shrink-0 overflow-visible">
              <div className="bg-gray-700 h-12">
                <div className="w-48 px-4 flex items-center justify-center h-full text-xs font-medium text-gray-300 uppercase tracking-wider border-l border-gray-600">
                  Actions
                </div>
              </div>
              <div className="bg-gray-800 divide-y divide-gray-700 overflow-visible">
                {currentContainers.map((container, index) => {
                  const isDropdownOpen = openDropdownId === container.id;
                  // Determine if we're in the last 3 rows to position dropdown above
                  const isNearBottom = index >= currentContainers.length - 3;
                  
                  return (
                    <div 
                      key={container.id} 
                      className={`hover:bg-gray-750 transition-all h-16 relative ${
                        isChanged(container.id) ? 'bg-yellow-900/30' : ''
                      }`}
                    >
                      <div className="w-48 px-4 flex items-center justify-center whitespace-nowrap text-sm font-medium border-l border-gray-600 h-full">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditContainer(container)}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Edit
                          </button>
                          
                          {/* Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(isDropdownOpen ? null : container.id);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center"
                            >
                              Actions
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {isDropdownOpen && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 w-35 bg-gray-700 rounded-md shadow-lg z-[9999] border border-gray-600 ${
                                  isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                                }`}
                              >
                                <div className="py-1">
                                  <div
                                    onClick={() => {
                                      handleBottle(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer px-4 py-2 text-sm text-green-400 hover:bg-gray-600 hover:text-green-300 transition-colors"
                                  >
                                    Bottle
                                  </div>
                                  <div
                                    onClick={() => {
                                      handleTransfer(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer px-4 py-2 text-sm text-purple-400 hover:bg-gray-600 hover:text-purple-300 transition-colors"
                                  >
                                    Transfer
                                  </div>
                                  <div
                                    onClick={() => {
                                      handleTankAdjust(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer px-4 py-2 text-sm text-orange-400 hover:bg-gray-600 hover:text-orange-300 transition-colors"
                                  >
                                    Tank Adjust
                                  </div>
                                  <div
                                    onClick={() => {
                                      handleProofDown(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="cursor-pointer px-4 py-2 text-sm text-cyan-400 hover:bg-gray-600 hover:text-cyan-300 transition-colors"
                                  >
                                    Proof Down
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
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
            {totalPages > 1 && sortedInventory.length > itemsPerPage && (
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
                      <span className="font-medium">{Math.min(endIndex, sortedInventory.length)}</span> of{' '}
                      <span className="font-medium">{sortedInventory.length}</span> results
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
          message="Are you sure you want to delete this container?"
          onCancel={() => {
            setShowConfirmModal(false);
            setItemToDelete(null);
          }}
          onConfirm={() => {
            if (itemToDelete) {
              handleDeleteContainer(itemToDelete.id);
            }
          }}
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

      {showBottlingModal && (
        <BottlingModal
          isOpen={showBottlingModal}
          onClose={() => {
            setShowBottlingModal(false);
            setEditingContainer(null);
          }}
          container={editingContainer}
          onSave={handleBottlingSave}
        />
      )}

      {showTransferModal && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setEditingContainer(null);
          }}
          sourceContainer={editingContainer}
          allContainers={inventory}
          products={products}
          onSave={handleTransferSave}
        />
      )}

      {showAdjustModal && (
        <AdjustContentsModal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setEditingContainer(null);
          }}
          container={editingContainer}
          products={products}
          onSave={handleAdjustSave}
        />
      )}
    </div>
  );
};

export default InventoryView;
