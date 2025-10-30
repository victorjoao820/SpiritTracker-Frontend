import React, { useState, useEffect } from "react";
import { AddEditContainerModal, ConfirmationModal, ProofDownModal, BottlingModal, TransferModal, AdjustContentsModal } from "../modals";
import { containersAPI, productsAPI, containerOperationsAPI } from "../../services/api";
import { CONTAINER_CAPACITIES_GALLONS } from "../../constants";
import { calculateDerivedValuesFromWeight, calculateSpiritDensity} from "../../utils/helpers";
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";
import Button from "../ui/Button";

import { Menu , Milk, ArrowLeftRight, BarrelIcon, BadgePercent } from "lucide-react";
import { TbCylinderPlus } from "react-icons/tb";


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
      const response = await containersAPI.proofDown(proofDownData);

      if (!response.success) {
        throw new Error('Proof down failed');
      }
      
      // Update the inventory state and track changes
      setInventory((prev) =>
        prev.map((container) =>
          container.id === proofDownData.containerId ? response.container : container
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
      
      console.log("adjsut:", adjustData);
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
          <h3 className="text-lg font-semibold text-primary">
            Container Inventory
          </h3>
          <p className="text-sm text-gray-400">
            Manage your distillery containers and barrels
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingContainer(null);
            setShowFormModal(true);
          }}
          variant="default"
          icon={<TbCylinderPlus className="w-4 h-4 mr-2" />}
        >
          Add Container
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Containers Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading inventory...</div>
        </div>
      ) : sortedInventory.length === 0 ? (
        <div className="rounded-lg p-12 text-center border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="mb-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>No containers found</p>
          <Button
          onClick={() => setShowFormModal(true)}
          variant="default"
          icon={<TbCylinderPlus className="w-4 h-4 mr-2" />}
          >
          Add Your First Container
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Three Separate Tables That Look Like One */}
          <div className="flex">
            
            {/* Table 1: ID, Name, Account */}
            <div className="flex-shrink-0">
              <div className="h-12 transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex h-full border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="w-12 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider  transition-colors" style={{ color: 'var(--text-secondary)'}}>
                    ID
                  </div>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider  transition-colors" style={{ color: 'var(--text-secondary)'}}>
                    Name
                  </div>
                  <div className="w-24 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider border-r transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                    Account
                  </div>
                </div>
              </div>
              <div className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentContainers.map((container, index) => {
                  return (
                    <div 
                      key={container.id} 
                      className={`flex transition-all h-16 ${
                        isChanged(container.id) ? 'bg-yellow-900/30 animate-pulse' : ''
                      }`}
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="w-12 px-4 flex items-center justify-center whitespace-nowrap text-sm  transition-colors" style={{ color: 'var(--text-secondary)'}}>
                        {startIndex + index + 1}
                      </div>
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap transition-colors">
                        <div className="text-center">
                          <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {getChangedValueDisplay(
                              container.id,
                              'name',
                              container.name || 'Unnamed',
                              (v) => v || 'Unnamed'
                            )}
                          </div>
                          <div className="text-xs capitalize transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                            {getChangedValueDisplay(
                              container.id,
                              'type',
                              container.type,
                              (v) => v?.replace(/_/g, ' ') || ''
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-24 px-4 flex items-center justify-center whitespace-nowrap text-sm border-r transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
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
              <div className="h-12 transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex min-w-max h-full border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </div>
                  <div className="w-32 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Product
                  </div>
                  <div className="w-24 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Fill Date
                  </div>
                  <div className="w-20 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Proof
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Tare Weight
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Gross Weight
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Net Weight
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Wine Gallons
                  </div>
                  <div className="w-28 px-4 flex items-center justify-center text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Proof Gallons
                  </div>
                </div>
              </div>
              <div className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentContainers.map((container, index) => {
                  const calculated = calculateContainerData(container);
                  const product = products.find(p => p.id === container.productId);
                  
                  return (
                    <div 
                      key={container.id} 
                      className={`flex transition-all h-16 ${
                        isChanged(container.id) ? 'bg-yellow-900/30' : ''
                      }`}
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="w-8 h-2 transition-colors" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <div 
                              className={`h-2 ${
                                container.status === 'FILLED' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${calculated.percentageFull}%` }}
                            ></div>
                          </div>
                          <span className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            {container.status === 'FILLED' ? `${calculated.percentageFull.toFixed(0)}%` : 'Empty'}
                          </span>
                        </div>
                      </div>
                      <div className="w-32 px-4 flex items-center justify-center whitespace-nowrap">
                        <div className="text-sm text-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                          {getChangedValueDisplay(
                            container.id,
                            'productName',
                            product?.name || 'No Product',
                            (v) => v || 'No Product'
                          )}
                        </div>
                      </div>
                      <div className="w-24 px-4 flex items-center justify-center whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {getChangedValueDisplay(
                          container.id,
                          'fillDate',
                          container.fillDate,
                          (v) => v ? new Date(v).toLocaleDateString() : 'N/A'
                        )}
                      </div>
                      <div className="w-20 px-4 flex items-center justify-center whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {getChangedValueDisplay(
                          container.id,
                          'proof',
                          container.proof,
                          (v) => v ? `${v}°` : 'N/A'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {calculated.tareWeight.toFixed(1)} lbs
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {getChangedValueDisplay(
                          container.id,
                          'grossWeight',
                          calculated.grossWeight,
                          (v) => v.toFixed(1) + ' lbs'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {getChangedValueDisplay(
                          container.id,
                          'netWeight',
                          container.netWeight,
                          (v) => (v ? Number(v).toFixed(1) : '0.0') + ' lbs'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {getChangedValueDisplay(
                          container.id,
                          'wineGallons',
                          calculated.wineGallons,
                          (v) => v.toFixed(2) + ' gal'
                        )}
                      </div>
                      <div className="w-28 px-4 flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
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
            <div className="flex-shrink-0 overflow-visible" >
              <div className="h-12 transition-colors " style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="w-48 px-4 flex items-center justify-center h-full text-xs border-l border-b font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)'}}>
                  Actions
                </div>
              </div>
              <div className="divide-y overflow-visible transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentContainers.map((container, index) => {
                  const isDropdownOpen = openDropdownId === container.id;
                  // Determine if we're in the last 3 rows to position dropdown above
                  const isNearBottom = index >= currentContainers.length - 3;
                  // For first 3 rows, show tooltips below the dropdown
                  const isNearTop = index < 3;
                  
                  return (
                    <div 
                      key={container.id} 
                      className={`transition-all h-16 relative ${
                        isChanged(container.id) ? 'bg-yellow-900/30' : ''
                      }`}
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="w-48 px-4 flex items-center justify-center whitespace-nowrap text-sm font-medium border-l h-full transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex justify-center items-center space-x-2">
                          {/* Edit and Delete Buttons */}
                          <ActionButtons
                            onEdit={() => handleEditContainer(container)}
                            onDelete={() => {
                              setItemToDelete(container);
                              setShowConfirmModal(true);
                            }}
                          />
                          
                          {/* Actions Dropdown Menu */}
                          <div className="relative">
                            <div className="relative inline-block group">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(isDropdownOpen ? null : container.id);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center"
                            >
                                <Menu cursor-pointer text-blue-400 hover:text-blue-300 size={16} />
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                Actions
                              </span>
                            </div>
                            {isDropdownOpen && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 w-45 bg-gray-700 rounded-md shadow-lg z-[9999] border border-gray-600 ${
                                  isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                                }`}
                              >
                                <div className="py-1 flex">
                                  <div
                                    onClick={() => {
                                      handleBottle(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="relative group cursor-pointer px-3 py-2 text-sm text-green-400 hover:bg-gray-600 hover:text-green-300 transition-colors flex items-center"
                                  >
                                    <Milk size={20} />
                                    {/* <span>Bottle</span> */}
                                    <span className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 ${
                                      isNearTop ? 'top-full mt-2' : 'bottom-full mb-2'
                                    }`}>
                                      Bottle spirit
                                    </span>
                                  </div>
                                  <div
                                    onClick={() => {
                                      handleTransfer(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="relative group cursor-pointer px-3 py-2 text-sm text-purple-400 hover:bg-gray-600 hover:text-purple-300 transition-colors flex items-center"
                                  >
                                    <ArrowLeftRight size={20} />
                                    {/* <span>Transfer</span> */}
                                    <span className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 ${
                                      isNearTop ? 'top-full mt-2' : 'bottom-full mb-2'
                                    }`}>
                                      Transfer spirit
                                    </span>
                                  </div>
                                  <div
                                    onClick={() => {
                                      handleTankAdjust(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="relative group cursor-pointer px-3 py-2 text-sm text-orange-400 hover:bg-gray-600 hover:text-orange-300 transition-colors flex items-center"
                                  >
                                    <BarrelIcon size={20}/>
                                    {/* <span>Tank Adjust</span> */}
                                    <span className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 ${
                                      isNearTop ? 'top-full mt-2' : 'bottom-full mb-2'
                                    }`}>
                                      Tank Adjust
                                    </span>
                                  </div>
                                  <div
                                    onClick={() => {
                                      handleProofDown(container);
                                      setOpenDropdownId(null);
                                    }}
                                    className="relative group cursor-pointer px-3 py-2 text-sm text-cyan-400 hover:bg-gray-600 hover:text-cyan-300 transition-colors flex items-center"
                                  >
                                    <BadgePercent size={20}/>
                                    {/* <span>Proof Down</span> */}
                                    <span className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 ${
                                      isNearTop ? 'top-full mt-2' : 'bottom-full mb-2'
                                    }`}>
                                      Proof Down
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={sortedInventory.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
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
