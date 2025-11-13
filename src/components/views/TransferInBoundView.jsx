import React, { useState, useEffect, useCallback, useRef } from 'react';
import { transferInboundAPI, containersAPI, containerKindsAPI, productsAPI, dspsAPI } from '../../services/api';
import { AddEditDSPModal } from '../modals';
import { calculateDerivedValuesFromWineGallons } from '../../utils/helpers';

// Format date for datetime-local input
const formatDateTimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Get today's date in datetime-local format
const getTodayDateTime = () => {
  return formatDateTimeLocal(new Date());
};

// Default container types for "Use New"
const newContainerTypes = [
  { name: 'Barrel', type: 'barrel' },
  { name: 'Tote', type: 'tote' },
  { name: 'Tank', type: 'tank' },
];

const TransferInBoundView = () => {

  // Reason options
  const reasonOptions = [
    { value: 'PRODUCTION', label: 'Production' },
    { value: 'AGING', label: 'Aging' },
    { value: 'BLENDING', label: 'Blending' },
    { value: 'STORAGE', label: 'Storage' },
    { value: 'RETURN', label: 'Return' },
    { value: 'OTHER', label: 'Other' },
  ];

  const [rowData, setRowData] = useState({
    tibInNumber: '1', // Will be updated when data loads
    spiritType: '',
    fromDSP: '',
    totalGallons: '',
    reason: '',
    totalSpiritCost: '',
    shippingCost: '',
    sealNumber: '',
    transferDate: getTodayDateTime(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Container selection state
  const [useNew, setUseNew] = useState(false);
  const [useOld, setUseOld] = useState(false);
  const [selectedNewContainers, setSelectedNewContainers] = useState({
    Barrel: false,
    Tote: false,
    Tank: false,
  });
  const [newContainerCounts, setNewContainerCounts] = useState({
    Barrel: 0,
    Tote: 0,
    Tank: 0,
  });
  const [newContainerNames, setNewContainerNames] = useState({
    Barrel: '',
    Tote: '',
    Tank: '',
  });
  const [selectedOldContainers, setSelectedOldContainers] = useState([]);
  const [emptyContainers, setEmptyContainers] = useState([]);
  const [containerKinds, setContainerKinds] = useState([]);
  const [products, setProducts] = useState([]);
  const [dsps, setDsps] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const [focusedCountInput, setFocusedCountInput] = useState(null);
  const [showDSPModal, setShowDSPModal] = useState(false);

  // Helper function to save state to sessionStorage
  const saveStateToSession = useCallback((state) => {
    try {
      const stateToSave = {
        rowData: state.rowData,
        baseTotalGallons: state.baseTotalGallons,
        useNew: state.useNew,
        useOld: state.useOld,
        selectedNewContainers: state.selectedNewContainers,
        newContainerCounts: state.newContainerCounts,
        newContainerNames: state.newContainerNames,
        selectedOldContainers: state.selectedOldContainers,
        lostGallons: state.lostGallons,
        timestamp: Date.now()
      };
      sessionStorage.setItem('transferInboundState', JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Error saving state to sessionStorage:', err);
    }
  }, []);

  // Helper function to load state from sessionStorage
  const loadStateFromSession = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem('transferInboundState');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (err) {
      console.error('Error loading state from sessionStorage:', err);
    }
    return null;
  }, []);

  // Helper function to clear state from sessionStorage
  const clearStateFromSession = useCallback(() => {
    try {
      sessionStorage.removeItem('transferInboundState');
    } catch (err) {
      console.error('Error clearing state from sessionStorage:', err);
    }
  }, []);

  const fetchTransferInbound = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await transferInboundAPI.getAll();
      
      // Handle both old format (array) and new format (object with transfers and nextTransferNumber)
      const transfers = response.transfers || response;
      const nextTransferNumber = response.nextTransferNumber;
      
      // Calculate next TIB number: max transferNumber + 1
      // If nextTransferNumber is provided, use it; otherwise calculate from transfers
      let calculatedNextNumber = 1;
      if (nextTransferNumber) {
        calculatedNextNumber = nextTransferNumber;
      } else if (transfers && Array.isArray(transfers) && transfers.length > 0) {
        // Calculate max transferNumber from all transfers
        const maxNumber = transfers.reduce((max, t) => {
          if (!t.transferNumber) return max;
          // Extract numeric part from transferNumber (handle formats like "TIB-1", "1", etc.)
          const numMatch = t.transferNumber.toString().match(/\d+/);
          const num = numMatch ? parseInt(numMatch[0], 10) : 0;
          return Math.max(max, num);
        }, 0);
        calculatedNextNumber = maxNumber + 1;
      }
      
      // Check for incomplete work in sessionStorage
      const savedState = loadStateFromSession();
      const hasIncompleteWork = savedState && savedState.baseTotalGallons && 
        parseFloat(savedState.baseTotalGallons) > 0;
      
      // If there's incomplete work, restore it
      if (hasIncompleteWork) {
        setRowData(savedState.rowData || {
          tibInNumber: calculatedNextNumber.toString(),
          spiritType: '',
          fromDSP: '',
          totalGallons: '',
          reason: '',
          totalSpiritCost: '',
          shippingCost: '',
          sealNumber: '',
          transferDate: getTodayDateTime(),
        });
        if (savedState.baseTotalGallons) {
          setBaseTotalGallons(savedState.baseTotalGallons);
        }
        setUseNew(savedState.useNew || false);
        setUseOld(savedState.useOld || false);
        setSelectedNewContainers(savedState.selectedNewContainers || {
          Barrel: false,
          Tote: false,
          Tank: false,
        });
        setNewContainerCounts(savedState.newContainerCounts || {
          Barrel: 0,
          Tote: 0,
          Tank: 0,
        });
        setNewContainerNames(savedState.newContainerNames || {
          Barrel: '',
          Tote: '',
          Tank: '',
        });
        setSelectedOldContainers(savedState.selectedOldContainers || []);
        setLostGallons(savedState.lostGallons || 0);
      } else {
        // No incomplete work - clear specified fields
        setRowData({
          tibInNumber: calculatedNextNumber.toString(),
          spiritType: '',
          fromDSP: '',
          totalGallons: '', // Clear
          reason: '', // Clear
          totalSpiritCost: '',
          shippingCost: '', // Clear
          sealNumber: '', // Clear
          transferDate: getTodayDateTime(),
        });
        setBaseTotalGallons('');
        setUseNew(false);
        setUseOld(false);
        setSelectedNewContainers({
          Barrel: false,
          Tote: false,
          Tank: false,
        });
        setNewContainerCounts({
          Barrel: 0,
          Tote: 0,
          Tank: 0,
        });
        setNewContainerNames({
          Barrel: '',
          Tote: '',
          Tank: '',
        });
        setSelectedOldContainers([]);
        setLostGallons(0);
        // Clear sessionStorage
        clearStateFromSession();
      }
      setError('');
    } catch (err) {
      console.error('Error fetching transfer inbound:', err);
      setError('Failed to fetch transfer inbound data.');
    } finally {
      setIsLoading(false);
    }
  }, [loadStateFromSession, clearStateFromSession]);

  useEffect(() => {
    fetchTransferInbound();
  }, [fetchTransferInbound]);

  // Fetch products (spirits) on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await productsAPI.getAll();
        setProducts(productsData || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch DSPs function
  const fetchDSPs = useCallback(async () => {
    try {
      const dspsData = await dspsAPI.getAll();
      setDsps(dspsData || []);
    } catch (err) {
      console.error('Error fetching DSPs:', err);
    }
  }, []);

  // Fetch DSPs on component mount
  useEffect(() => {
    fetchDSPs();
  }, [fetchDSPs]);

  // Handle new DSP creation
  const handleNewDSPCreated = async (newDSP) => {
    // Refresh DSPs list
    await fetchDSPs();
    // Set the newly created DSP as the selected value
    if (newDSP && newDSP.name) {
      handleCellChange('fromDSP', newDSP.name);
    }
    setShowDSPModal(false);
  };

  // Fetch empty containers and container kinds when needed
  useEffect(() => {
    const fetchContainerData = async () => {
      if (useOld) {
        try {
          const containers = await containersAPI.getAll();
          const empty = containers.filter(container => 
            container.status === 'EMPTY' || container.netWeight === 0 || !container.netWeight
          );
          setEmptyContainers(empty);
        } catch (err) {
          console.error('Error fetching containers:', err);
        }
      }
      if (useNew) {
        try {
          const kinds = await containerKindsAPI.getAll();
          setContainerKinds(kinds);
        } catch (err) {
          console.error('Error fetching container kinds:', err);
        }
      }
    };
    fetchContainerData();
  }, [useOld, useNew]);

  // Store original total gallons for calculation (before reduction)
  const [baseTotalGallons, setBaseTotalGallons] = useState('');
  const isUpdatingFromCalculation = useRef(false);
  // Track lost gallons amount (when remaining is saved as lost)
  const [lostGallons, setLostGallons] = useState(0);

  // Track when totalGallons is manually changed - store as base value
  const handleTotalGallonsChange = (value) => {
    setBaseTotalGallons(value);
    isUpdatingFromCalculation.current = false;
    handleCellChange('totalGallons', value);
  };

  // Helper function to calculate remaining gallons (baseTotalGallons minus allocated minus lost)
  const getRemainingGallons = useCallback(() => {
    const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
    if (baseTotal <= 0) {
      return 0;
    }
    
    let remaining = baseTotal;
    
    // Process new containers first
    if (useNew) {
      Object.entries(selectedNewContainers).forEach(([name, isSelected]) => {
        if (isSelected) {
          const count = parseInt(newContainerCounts[name] || 0, 10) || 0;
          if (count > 0) {
            const containerType = newContainerTypes.find(ct => ct.name === name);
            if (containerType) {
              const kind = containerKinds.find(ck => 
                ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                ck.type === containerType.type
              );
              if (kind && kind.capacityGallons) {
                const capacity = parseFloat(kind.capacityGallons) || 0;
                const totalCapacity = capacity * count;
                // Cap the allocation at remaining gallons
                const cappedAllocation = Math.min(totalCapacity, remaining);
                remaining = Math.max(0, remaining - cappedAllocation);
              }
            }
          }
        }
      });
    }
    
    // Process old containers
    if (useOld) {
      selectedOldContainers.forEach(containerId => {
        const container = emptyContainers.find(c => c.id === containerId);
        if (container && container.containerKind?.capacityGallons) {
          const capacity = parseFloat(container.containerKind.capacityGallons);
          // Cap the allocation at remaining gallons
          const cappedAllocation = Math.min(capacity, remaining);
          remaining = Math.max(0, remaining - cappedAllocation);
        }
      });
    }
    
    // Subtract lost gallons if any
    remaining = Math.max(0, remaining - lostGallons);
    
    return remaining;
  }, [baseTotalGallons, rowData.totalGallons, useNew, useOld, selectedNewContainers, newContainerCounts, selectedOldContainers, containerKinds, emptyContainers, lostGallons]);

  // Helper function to calculate allocated gallons from other containers (excluding current container type)
  const getAllocatedGallons = useCallback((excludeContainerType = null) => {
    let allocated = 0;
    
    if (useNew) {
      Object.entries(selectedNewContainers).forEach(([name, isSelected]) => {
        if (isSelected && name !== excludeContainerType) {
          const count = parseInt(newContainerCounts[name] || 0, 10) || 0;
          if (count > 0) {
            const containerType = newContainerTypes.find(ct => ct.name === name);
            if (containerType) {
              const kind = containerKinds.find(ck => 
                ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                ck.type === containerType.type
              );
              if (kind && kind.capacityGallons) {
                allocated += (parseFloat(kind.capacityGallons) || 0) * count;
              }
            }
          }
        }
      });
    }
    
    if (useOld) {
      selectedOldContainers.forEach(containerId => {
        const container = emptyContainers.find(c => c.id === containerId);
        if (container && container.containerKind?.capacityGallons) {
          allocated += parseFloat(container.containerKind.capacityGallons);
        }
      });
    }
    
    return allocated;
  }, [useNew, useOld, selectedNewContainers, newContainerCounts, selectedOldContainers, containerKinds, emptyContainers]);

  // Set baseTotalGallons when rowData.totalGallons is loaded or changed manually
  useEffect(() => {
    // Only set baseTotalGallons if it's not already set or if totalGallons was manually changed
    if (rowData.totalGallons && (!baseTotalGallons || isUpdatingFromCalculation.current === false)) {
      // Only update if the value is different from current base
      if (rowData.totalGallons !== baseTotalGallons) {
        setBaseTotalGallons(rowData.totalGallons);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData.totalGallons]);

  // Save state to sessionStorage whenever container selections change
  useEffect(() => {
    // Only save if there's actual work (baseTotalGallons > 0)
    if (baseTotalGallons && parseFloat(baseTotalGallons) > 0) {
      saveStateToSession({
        rowData,
        baseTotalGallons,
        useNew,
        useOld,
        selectedNewContainers,
        newContainerCounts,
        newContainerNames,
        selectedOldContainers,
        lostGallons
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNewContainers, newContainerCounts, newContainerNames, selectedOldContainers, lostGallons, baseTotalGallons]);

  const handleCellChange = (field, value) => {
    setRowData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      // Save state to sessionStorage on change
      setTimeout(() => {
        saveStateToSession({
          rowData: newData,
          baseTotalGallons,
          useNew,
          useOld,
          selectedNewContainers,
          newContainerCounts,
          newContainerNames,
          selectedOldContainers,
          lostGallons
        });
      }, 0);
      return newData;
    });
  };

  const handleUseNewChange = (checked) => {
    setUseNew(checked);
    if (!checked) {
      // Reset selections when unchecked
      setSelectedNewContainers({
        Barrel: false,
        Tote: false,
        Tank: false,
      });
    }
    // Save state after change
    setTimeout(() => {
      saveStateToSession({
        rowData,
        baseTotalGallons,
        useNew: checked,
        useOld,
        selectedNewContainers: checked ? selectedNewContainers : { Barrel: false, Tote: false, Tank: false },
        newContainerCounts,
        newContainerNames,
        selectedOldContainers,
        lostGallons
      });
    }, 0);
  };

  const handleUseOldChange = (checked) => {
    setUseOld(checked);
    if (!checked) {
      // Reset selections when unchecked
      setSelectedOldContainers([]);
    }
    // Save state after change
    setTimeout(() => {
      saveStateToSession({
        rowData,
        baseTotalGallons,
        useNew,
        useOld: checked,
        selectedNewContainers,
        newContainerCounts,
        newContainerNames,
        selectedOldContainers: checked ? selectedOldContainers : [],
        lostGallons
      });
    }, 0);
  };

  const handleNewContainerToggle = (containerName) => {
    // Check if remaining gallons is 0 - if so, only allow unchecking
    const remaining = getRemainingGallons();
    const isCurrentlyChecked = selectedNewContainers[containerName];
    
    // If trying to check a new container but remaining is 0, prevent it
    if (!isCurrentlyChecked && remaining <= 0) {
      return; // Don't allow checking when remaining is 0
    }
    
    setSelectedNewContainers(prev => ({
      ...prev,
      [containerName]: !prev[containerName]
    }));
  };

  const handleNewContainerCountChange = (containerName, value) => {
    const count = Math.max(0, parseInt(value || 0, 10) || 0);
    setNewContainerCounts(prev => ({
      ...prev,
      [containerName]: count
    }));
  };

  const handleNewContainerNameChange = (containerName, value) => {
    setNewContainerNames(prev => ({
      ...prev,
      [containerName]: value
    }));
  };

  const handleOldContainerToggle = (containerId) => {
    // Check if remaining gallons is 0 - if so, only allow unchecking
    const remaining = getRemainingGallons();
    const isCurrentlyChecked = selectedOldContainers.includes(containerId);
    
    // If trying to check a new container but remaining is 0, prevent it
    if (!isCurrentlyChecked && remaining <= 0) {
      return; // Don't allow checking when remaining is 0
    }
    
    setSelectedOldContainers(prev => {
      if (prev.includes(containerId)) {
        return prev.filter(id => id !== containerId);
      } else {
        return [...prev, containerId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage(''); // Clear previous success message

      // Validation
      if (!rowData.tibInNumber.trim()) {
        setError('TIB In Number is required');
        setIsSaving(false);
        return;
      }
      if (!rowData.fromDSP) {
        setError('From DSP is required');
        setIsSaving(false);
        return;
      }
      if (!rowData.totalGallons || parseFloat(rowData.totalGallons) <= 0) {
        setError('Total Gallons must be a valid number > 0');
        setIsSaving(false);
        return;
      }
      if (!rowData.reason) {
        setError('Reason is required');
        setIsSaving(false);
        return;
      }

      // Check remaining gallons - must be less than 5
      const remainingGallons = getRemainingGallons();
      let hasLostRemaining = false;
      if (remainingGallons > 0 && remainingGallons < 5) {
        const confirmMessage = `The remain spirit must lost. Remaining: ${remainingGallons.toFixed(2)} gallons. Do you want to continue?`;
        const userConfirmed = window.confirm(confirmMessage);
        if (!userConfirmed) {
          setIsSaving(false);
          return;
        }
        hasLostRemaining = true;
      }

      // Build container selection information for notes
      const containerInfo = [];
      
      // New containers information
      if (useNew) {
        Object.entries(selectedNewContainers).forEach(([name, isSelected]) => {
          if (isSelected) {
            const count = parseInt(newContainerCounts[name] || 0, 10) || 0;
            if (count > 0) {
              const containerType = newContainerTypes.find(ct => ct.name === name);
              const kind = containerKinds.find(ck => 
                ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                ck.type === containerType.type
              );
              const capacity = parseFloat(kind?.capacityGallons || 0) || 0;
              const containerName = newContainerNames[name] || '';
              
              // Calculate what was actually allocated (capped)
              const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
              let remaining = baseTotal;
              
              // Process containers before this one to get remaining
              const containerTypeIndex = newContainerTypes.findIndex(ct => ct.name === name);
              for (let i = 0; i < containerTypeIndex; i++) {
                const otherType = newContainerTypes[i];
                const otherChecked = selectedNewContainers[otherType.name];
                if (otherChecked) {
                  const otherCount = parseInt(newContainerCounts[otherType.name] || 0, 10) || 0;
                  if (otherCount > 0) {
                    const otherKind = containerKinds.find(ck => 
                      ck.name.toLowerCase().includes(otherType.name.toLowerCase()) ||
                      ck.type === otherType.type
                    );
                    if (otherKind && otherKind.capacityGallons) {
                      const otherCapacity = parseFloat(otherKind.capacityGallons) || 0;
                      const otherTotal = otherCapacity * otherCount;
                      const cappedOther = Math.min(otherTotal, remaining);
                      remaining = Math.max(0, remaining - cappedOther);
                    }
                  }
                }
              }
              
              const theoreticalTotal = capacity * count;
              const allocatedTotal = Math.min(theoreticalTotal, remaining);
              
              let containerDetail = `New ${containerType.type}: ${count} x ${capacity}gal = ${allocatedTotal.toFixed(2)}gal`;
              if (containerName) {
                containerDetail += ` (${containerName})`;
              }
              if (theoreticalTotal > remaining && remaining > 0) {
                const fullContainers = Math.floor(remaining / capacity);
                const partialAmount = remaining % capacity;
                if (partialAmount > 0.01) {
                  containerDetail += ` [Partial: ${fullContainers} full, One: ${partialAmount.toFixed(2)}gal]`;
                }
              }
              containerInfo.push(containerDetail);
            }
          }
        });
      }
      
      // Old containers information
      if (useOld && selectedOldContainers.length > 0) {
        const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
        let remaining = baseTotal;
        
        // Process new containers first
        if (useNew) {
          Object.entries(selectedNewContainers).forEach(([name, isSelected]) => {
            if (isSelected) {
              const count = parseInt(newContainerCounts[name] || 0, 10) || 0;
              if (count > 0) {
                const containerType = newContainerTypes.find(ct => ct.name === name);
                const kind = containerKinds.find(ck => 
                  ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                  ck.type === containerType.type
                );
                if (kind && kind.capacityGallons) {
                  const capacity = parseFloat(kind.capacityGallons) || 0;
                  const total = capacity * count;
                  const capped = Math.min(total, remaining);
                  remaining = Math.max(0, remaining - capped);
                }
              }
            }
          });
        }
        
        // Process old containers
        selectedOldContainers.forEach(containerId => {
          const container = emptyContainers.find(c => c.id === containerId);
          if (container) {
            const capacity = parseFloat(container.containerKind?.capacityGallons || 0) || 0;
            const allocated = Math.min(capacity, remaining);
            const containerName = container.name || 'Unnamed';
            let containerDetail = `Old Container: ${containerName} (${allocated.toFixed(2)}gal`;
            if (capacity > remaining && remaining > 0) {
              containerDetail += `, Partial: ${remaining.toFixed(2)}gal`;
            }
            containerDetail += ')';
            containerInfo.push(containerDetail);
            remaining = Math.max(0, remaining - allocated);
          }
        });
      }
      
      // Build notes with reason, cost, and container info
      let notes = rowData.reason;
      if (rowData.totalSpiritCost) {
        notes += ` | Total Spirit Cost: ${rowData.totalSpiritCost}`;
      }
      if (containerInfo.length > 0) {
        notes += ` | Containers: ${containerInfo.join('; ')}`;
      }
      if (hasLostRemaining) {
        // If saved with lost remaining, mark it as lost and remaining should be 0
        notes += ` | Lost: ${remainingGallons.toFixed(2)}gal`;
      } else if (remainingGallons > 0) {
        notes += ` | Remaining: ${remainingGallons.toFixed(2)}gal`;
      }

      const transferData = {
        transferNumber: rowData.tibInNumber,
        transferType: 'CONTAINER', // Default to CONTAINER for inbound
        direction: 'INBOUND',
        destination: rowData.fromDSP,
        volumeGallons: parseFloat(rowData.totalGallons),
        proof: 0, // Default proof, can be updated later
        transferDate: new Date(rowData.transferDate).toISOString(),
        sealNumber: rowData.sealNumber || null,
        carrier: rowData.shippingCost || null, // Using carrier field for shipping cost temporarily
        notes: notes,
        status: 'PENDING'
      };

      // Check if a transfer with the same TIB number already exists
      const existingTransfersResponse = await transferInboundAPI.getAll();
      const existingTransfers = existingTransfersResponse?.transfers || existingTransfersResponse || [];
      const existingTransfer = Array.isArray(existingTransfers) 
        ? existingTransfers.find(t => t.transferNumber === rowData.tibInNumber)
        : null;

      // Create containers from container selection before saving transfer
      const createdContainerIds = [];
      
      // Create new containers
      if (useNew) {
        const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
        let remaining = baseTotal;
        
        for (const containerType of newContainerTypes) {
          const isSelected = selectedNewContainers[containerType.name];
          if (isSelected) {
            const count = parseInt(newContainerCounts[containerType.name] || 0, 10) || 0;
            if (count > 0) {
              const kind = containerKinds.find(ck => 
                ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                ck.type === containerType.type
              );
              
              if (kind && kind.id) {
                const capacity = parseFloat(kind.capacityGallons || 0) || 0;
                const containerName = newContainerNames[containerType.name] || '';
                
                // Calculate how many full containers and partial
                const theoreticalTotal = capacity * count;
                const cappedTotal = Math.min(theoreticalTotal, remaining);
                const fullContainers = Math.floor(cappedTotal / capacity);
                const partialAmount = cappedTotal % capacity;
                
                // Calculate netWeight from capacity (wine gallons)
                const tareWeight = parseFloat(kind.tareWeight || 0) || 0;
                const defaultProof = 0; // Default proof, can be updated later
                const defaultTemp = 60; // Default temperature
                
                // Create full containers
                for (let i = 0; i < fullContainers; i++) {
                  try {
                    // Calculate netWeight from capacity (wine gallons)
                    const wineGallons = capacity;
                    const calculated = calculateDerivedValuesFromWineGallons(
                      wineGallons,
                      defaultProof,
                      tareWeight,
                      defaultTemp
                    );
                    
                    const containerData = {
                      name: containerName || `${containerType.type}-${i + 1}`,
                      type: containerType.type,
                      containerKindId: kind.id,
                      productId: rowData.spiritType || null,
                      status: 'FILLED',
                      proof: defaultProof,
                      tareWeight: tareWeight,
                      netWeight: calculated.netWeightLbs,
                      fillDate: rowData.transferDate ? new Date(rowData.transferDate) : new Date(),
                      notes: `Created from Transfer Inbound TIB-${rowData.tibInNumber}`
                    };
                    
                    const newContainer = await containersAPI.create(containerData);
                    createdContainerIds.push(newContainer.id);
                  } catch (err) {
                    console.error(`Error creating container ${i + 1} of ${containerType.name}:`, err);
                  }
                }
                
                // Create partial container if there's a partial amount
                if (partialAmount > 0.01) {
                  try {
                    // Calculate netWeight from partial amount (wine gallons)
                    const wineGallons = partialAmount;
                    const calculated = calculateDerivedValuesFromWineGallons(
                      wineGallons,
                      defaultProof,
                      tareWeight,
                      defaultTemp
                    );
                    
                    const containerData = {
                      name: containerName || `${containerType.type}-partial`,
                      type: containerType.type,
                      containerKindId: kind.id,
                      productId: rowData.spiritType || null,
                      status: 'FILLED',
                      proof: defaultProof,
                      tareWeight: tareWeight,
                      netWeight: calculated.netWeightLbs,
                      fillDate: rowData.transferDate ? new Date(rowData.transferDate) : new Date(),
                      notes: `Created from Transfer Inbound TIB-${rowData.tibInNumber} (Partial: ${partialAmount.toFixed(2)}gal)`
                    };
                    
                    const newContainer = await containersAPI.create(containerData);
                    createdContainerIds.push(newContainer.id);
                  } catch (err) {
                    console.error(`Error creating partial container for ${containerType.name}:`, err);
                  }
                }
                
                remaining = Math.max(0, remaining - cappedTotal);
              }
            }
          }
        }
      }
      
      // Update old containers (they already exist, just need to be filled/updated)
      if (useOld && selectedOldContainers.length > 0) {
        const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
        let remaining = baseTotal;
        
        // Process new containers first to get remaining
        if (useNew) {
          Object.entries(selectedNewContainers).forEach(([name, isSelected]) => {
            if (isSelected) {
              const count = parseInt(newContainerCounts[name] || 0, 10) || 0;
              if (count > 0) {
                const containerType = newContainerTypes.find(ct => ct.name === name);
                const kind = containerKinds.find(ck => 
                  ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                  ck.type === containerType.type
                );
                if (kind && kind.capacityGallons) {
                  const capacity = parseFloat(kind.capacityGallons) || 0;
                  const total = capacity * count;
                  const capped = Math.min(total, remaining);
                  remaining = Math.max(0, remaining - capped);
                }
              }
            }
          });
        }
        
        // Update old containers
        for (const containerId of selectedOldContainers) {
          const container = emptyContainers.find(c => c.id === containerId);
          if (container) {
            const capacity = parseFloat(container.containerKind?.capacityGallons || 0) || 0;
            const allocated = Math.min(capacity, remaining);
            
            try {
              const updateData = {
                productId: rowData.spiritType || container.productId || null,
                status: 'FILLED',
                fillDate: rowData.transferDate ? new Date(rowData.transferDate) : new Date(),
                notes: container.notes ? `${container.notes}; Filled from Transfer Inbound TIB-${rowData.tibInNumber}` : `Filled from Transfer Inbound TIB-${rowData.tibInNumber}`
              };
              
              await containersAPI.update(containerId, updateData);
              createdContainerIds.push(containerId);
            } catch (err) {
              console.error(`Error updating container ${containerId}:`, err);
            }
            
            remaining = Math.max(0, remaining - allocated);
          }
        }
      }

      let wasUpdated = false;
      if (existingTransfer) {
        // Update existing transfer with the same TIB number
        await transferInboundAPI.update(existingTransfer.id, transferData);
        wasUpdated = true;
      } else {
        // Create new transfer
        await transferInboundAPI.create(transferData);
        wasUpdated = false;
      }

      // If saved with lost remaining, set lost gallons so remaining shows as 0
      if (hasLostRemaining) {
        // Set lost gallons to make remaining display as 0
        setLostGallons(remainingGallons);
      }

      // Clear sessionStorage on successful save
      clearStateFromSession();
      
      setError('');
      // Show success message
      if (wasUpdated) {
        setSuccessMessage(`Transfer TIB-${rowData.tibInNumber} has been updated successfully.`);
      } else {
        setSuccessMessage(`Transfer TIB-${rowData.tibInNumber} has been created successfully.`);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error saving transfer inbound:', err);
      setError(err.response?.data?.error || 'Failed to save transfer inbound data.');
      setSuccessMessage(''); // Clear success message on error
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading transfer inbound data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
            Transfer Inbound
          </h3>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Manage transfer inbound records.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-700 p-4 rounded-lg text-white">{error}</div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-700 p-4 rounded-lg text-white">{successMessage}</div>
      )}

      {/* Main Content Layout: Form Fields on Left, Container Selection on Right */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Side: Form Fields */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-lg border p-4 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-md font-semibold mb-4 transition-colors" style={{ color: 'var(--text-primary)' }}>
              Transfer Information
            </h4>
            
            {/* Form Fields arranged in single column */}
            <div className="space-y-4">
              {/* TIB In Number */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  TIB In Number
                </label>
                <input
                  type="text"
                  value={rowData.tibInNumber}
                  onChange={(e) => handleCellChange('tibInNumber', e.target.value)}
                  onFocus={() => setFocusedField('tibInNumber')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  style={{ backgroundColor: focusedField === 'tibInNumber' ? 'var(--bg-accent)' : 'var(--bg-readable)' , color:'var(--text-primary)'}}
                  placeholder="Enter TIB In Number"
                />
              </div>
              
              {/* Spirit Type */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Spirit Type
                </label>
                <select
                  value={rowData.spiritType || ''}
                  onChange={(e) => handleCellChange('spiritType', e.target.value)}
                  onMouseDown={(e) => {
                    if (!rowData.spiritType) {
                      const placeholder = e.target.querySelector('option[value=""]');
                      if (placeholder) placeholder.style.display = 'none';
                    }
                  }}
                  onBlur={(e) => {
                    if (!rowData.spiritType) {
                      const placeholder = e.target.querySelector('option[value=""]');
                      if (placeholder) placeholder.style.display = '';
                    }
                  }}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {!rowData.spiritType && <option value="" disabled>-- Select Spirit Type --</option>}
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* From DSP */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  From DSP
                </label>
                {rowData.fromDSP === 'OTHER' || (rowData.fromDSP && !dsps.find(dsp => dsp.name === rowData.fromDSP)) ? (
                  <div>
                    <input
                      type="text"
                      value={rowData.fromDSP === 'OTHER' ? '' : rowData.fromDSP}
                      onChange={(e) => handleCellChange('fromDSP', e.target.value)}
                      onFocus={() => setFocusedField('fromDSP')}
                      onBlur={() => setFocusedField(null)}
                      style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                      className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      placeholder="Enter custom DSP"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDSPModal(true)}
                      className="mt-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none text-sm"
                      title="Add new DSP"
                    >
                      +New DSP
                    </button>
                  </div>
                ) : (
                  <select
                    value={rowData.fromDSP || ''}
                    onChange={(e) => handleCellChange('fromDSP', e.target.value)}
                    onMouseDown={(e) => {
                      if (!rowData.fromDSP) {
                        const placeholder = e.target.querySelector('option[value=""]');
                        if (placeholder) placeholder.style.display = 'none';
                      }
                    }}
                    onBlur={(e) => {
                      if (!rowData.fromDSP) {
                        const placeholder = e.target.querySelector('option[value=""]');
                        if (placeholder) placeholder.style.display = '';
                      }
                    }}
                    style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                    className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {!rowData.fromDSP && <option value="" disabled>-- Select DSP --</option>}
                    {dsps.map((dsp) => (
                      <option key={dsp.id} value={dsp.name}>
                        {dsp.name}
                      </option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>
                )}
              </div>
              
              {/* Total Gallons */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Total Gallons
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rowData.totalGallons}
                  onChange={(e) => handleTotalGallonsChange(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Reason
                </label>
                <select
                  value={rowData.reason || ''}
                  onChange={(e) => handleCellChange('reason', e.target.value)}
                  onMouseDown={(e) => {
                    if (!rowData.reason) {
                      const placeholder = e.target.querySelector('option[value=""]');
                      if (placeholder) placeholder.style.display = 'none';
                    }
                  }}
                  onBlur={(e) => {
                    if (!rowData.reason) {
                      const placeholder = e.target.querySelector('option[value=""]');
                      if (placeholder) placeholder.style.display = '';
                    }
                  }}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {!rowData.reason && <option value="" disabled>-- Select Reason --</option>}
                  {reasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Total Spirit Cost */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Total Spirit Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rowData.totalSpiritCost}
                  onChange={(e) => handleCellChange('totalSpiritCost', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              
              {/* Shipping Cost */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Shipping Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rowData.shippingCost}
                  onChange={(e) => handleCellChange('shippingCost', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              
              {/* Seal Number */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Seal Number
                </label>
                <input
                  type="text"
                  value={rowData.sealNumber}
                  onChange={(e) => handleCellChange('sealNumber', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter seal number"
                />
              </div>
              
              {/* Transfer Date */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Transfer Date
                </label>
                <input
                  type="datetime-local"
                  value={rowData.transferDate}
                  onChange={(e) => handleCellChange('transferDate', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)' , color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Container Selection */}
        <div className="col-span-2">
          <div className="rounded-lg border p-4 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
                Container Selection
              </h4>
              <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Remaining: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{Number(getRemainingGallons().toFixed(2))}</span> Gal
              </div>
            </div>
            
            {/* Warning message when remaining is 0 */}
            {getRemainingGallons() <= 0 && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-600 bg-opacity-20 border border-yellow-600" style={{ color: 'var(--text-primary)' }}>
                <p className="text-sm">
                  The remaining is {Number(getRemainingGallons().toFixed(2))} gallons. No more containers can be selected.
                </p>
              </div>
            )}
            
            {/* Use New Section - Top */}
            <div className="mb-6">
              <div className="border rounded p-4 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={useNew}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleUseNewChange(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                    Use New
                  </span>
                </div>

                {/* Use New - Table */}
                {useNew ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="transition-colors border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Select</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Capacity Gallons</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Count</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Total</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Name</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        {newContainerTypes.map((containerType) => {
                          const kind = containerKinds.find(ck => 
                            ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                            ck.type === containerType.type
                          );
                          const capacity = parseFloat(kind?.capacityGallons || 0) || 0;
                          const count = parseInt(newContainerCounts[containerType.name] || 0, 10) || 0;
                          const checked = selectedNewContainers[containerType.name] || false;
                          const name = newContainerNames[containerType.name] || '';
                          
                          // Calculate what this container would allocate based on sequential processing
                          // Start with base total and process containers in order
                          const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
                          let remaining = baseTotal;
                          let thisContainerAllocation = 0;
                          
                          // Process containers in the same order as the reduction calculation
                          const containerTypeIndex = newContainerTypes.findIndex(ct => ct.name === containerType.name);
                          
                          // Process new containers before this one
                          for (let i = 0; i < containerTypeIndex; i++) {
                            const otherType = newContainerTypes[i];
                            const otherChecked = selectedNewContainers[otherType.name];
                            if (otherChecked) {
                              const otherCount = parseInt(newContainerCounts[otherType.name] || 0, 10) || 0;
                              if (otherCount > 0) {
                                const otherKind = containerKinds.find(ck => 
                                  ck.name.toLowerCase().includes(otherType.name.toLowerCase()) ||
                                  ck.type === otherType.type
                                );
                                if (otherKind && otherKind.capacityGallons) {
                                  const otherCapacity = parseFloat(otherKind.capacityGallons) || 0;
                                  const otherTotal = otherCapacity * otherCount;
                                  const cappedOther = Math.min(otherTotal, remaining);
                                  remaining = Math.max(0, remaining - cappedOther);
                                }
                              }
                            }
                          }
                          
                          // Calculate this container's allocation
                          if (checked && count > 0) {
                            const theoreticalTotal = capacity * count;
                            thisContainerAllocation = Math.min(theoreticalTotal, remaining);
                          }
                          
                          // For display: show the capped allocation
                          const cappedTotal = thisContainerAllocation;
                          
                          // Calculate partial fill info
                          let partialFillNote = '';
                          if (checked && count > 0 && capacity * count > remaining && remaining > 0) {
                            const fullContainers = Math.floor(remaining / capacity);
                            const partialAmount = remaining % capacity;
                            if (fullContainers > 0 && partialAmount > 0.01) {
                              partialFillNote = `${fullContainers} full, One: ${partialAmount.toFixed(2)} Gal`;
                            } else if (partialAmount > 0.01) {
                              partialFillNote = `One: ${partialAmount.toFixed(2)} Gal`;
                            } else if (fullContainers < count && fullContainers > 0) {
                              partialFillNote = `${fullContainers} of ${count}`;
                            }
                          }
                          
                          // Check if remaining gallons is 0 to disable checkbox
                          const currentRemaining = getRemainingGallons();
                          const isDisabled = !checked && currentRemaining <= 0;
                          
                          return (
                            <tr key={containerType.name} className="transition-colors">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleNewContainerToggle(containerType.name)}
                                  disabled={isDisabled}
                                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                  style={{ 
                                    opacity: isDisabled ? 0.5 : 1,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                                  }}
                                  title={isDisabled ? `Remaining is ${currentRemaining.toFixed(2)} gallons. Cannot select more containers.` : ''}
                                />
                              </td>
                              <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{containerType.type}</td>
                              <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{capacity || 0}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder='0'
                                  value={focusedCountInput === containerType.name && count === 0 ? '' : count}
                                  onChange={(e) => handleNewContainerCountChange(containerType.name, e.target.value)}
                                  onFocus={() => {
                                    setFocusedCountInput(containerType.name);
                                    if (count === 0) {
                                      handleNewContainerCountChange(containerType.name, '');
                                    }
                                  }}
                                  onBlur={(e) => {
                                    setFocusedCountInput(null);
                                    if (e.target.value === '' || e.target.value === '0') {
                                      handleNewContainerCountChange(containerType.name, '0');
                                    }
                                  }}
                                  style={{ backgroundColor: checked ? 'var(--bg-accent)' : 'var(--bg-readable)' , color:'var(--text-primary)'}}
                                  className="w-20 p-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                  disabled={!checked}
                                />
                              </td>
                              <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                <div>
                                  {cappedTotal > 0 ? Number(cappedTotal.toFixed(2)) : 0}
                                  {partialFillNote && (
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                      ({partialFillNote})
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={name}
                                  onChange={(e) => handleNewContainerNameChange(containerType.name, e.target.value)}
                                  style={{ backgroundColor: checked ? 'var(--bg-accent)' : 'var(--bg-readable)' , color:'var(--text-primary)'}}
                                  className="w-full p-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                                  placeholder="Enter name"
                                  disabled={!checked}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Enable "Use New" to select new container types</p>
                )}
              </div>
            </div>

            {/* Use Old Section - Bottom */}
            <div>
              <div className="border rounded p-4 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={useOld}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleUseOldChange(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                    Use Old
                  </span>
                </div>

                {/* Use Old - Table */}
                {useOld ? (
                  <div className="overflow-x-auto">
                    {emptyContainers.length === 0 ? (
                      <p className="text-sm text-gray-400">No empty containers available</p>
                    ) : (
                      <table className="w-full">
                        <thead className="transition-colors border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Select</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Capacity Gallons</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Count</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                          {emptyContainers.map((container) => {
                            const capacity = parseFloat(container.containerKind?.capacityGallons || 0) || 0;
                            const isChecked = selectedOldContainers.includes(container.id);
                            const count = isChecked ? 1 : 0;
                            
                            // Calculate what this container would allocate based on sequential processing
                            const baseTotal = parseFloat(baseTotalGallons || rowData.totalGallons || 0);
                            let remaining = baseTotal;
                            
                            // Process all new containers first (they come before old containers)
                            if (useNew) {
                              Object.entries(selectedNewContainers).forEach(([name, isSelected]) => {
                                if (isSelected) {
                                  const count = parseInt(newContainerCounts[name] || 0, 10) || 0;
                                  if (count > 0) {
                                    const containerType = newContainerTypes.find(ct => ct.name === name);
                                    if (containerType) {
                                      const kind = containerKinds.find(ck => 
                                        ck.name.toLowerCase().includes(containerType.name.toLowerCase()) ||
                                        ck.type === containerType.type
                                      );
                                      if (kind && kind.capacityGallons) {
                                        const otherCapacity = parseFloat(kind.capacityGallons) || 0;
                                        const otherTotal = otherCapacity * count;
                                        const cappedOther = Math.min(otherTotal, remaining);
                                        remaining = Math.max(0, remaining - cappedOther);
                                      }
                                    }
                                  }
                                }
                              });
                            }
                            
                            // Process other old containers before this one
                            const otherSelectedOld = selectedOldContainers.filter(id => id !== container.id);
                            otherSelectedOld.forEach(containerId => {
                              const otherContainer = emptyContainers.find(c => c.id === containerId);
                              if (otherContainer && otherContainer.containerKind?.capacityGallons) {
                                const otherCapacity = parseFloat(otherContainer.containerKind.capacityGallons);
                                const cappedOther = Math.min(otherCapacity, remaining);
                                remaining = Math.max(0, remaining - cappedOther);
                              }
                            });
                            
                            // Calculate this container's allocation
                            const cappedTotal = isChecked ? Math.min(capacity, remaining) : 0;
                            
                            // Calculate partial fill info
                            let partialFillNote = '';
                            if (isChecked && capacity > remaining && remaining > 0) {
                              partialFillNote = `One: ${remaining.toFixed(2)} Gal`;
                            }
                            
                            // Check if remaining gallons is 0 to disable checkbox
                            const currentRemaining = getRemainingGallons();
                            const isDisabled = !isChecked && currentRemaining <= 0;
                            
                            return (
                              <tr key={container.id} className="transition-colors">
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleOldContainerToggle(container.id)}
                                    disabled={isDisabled}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                    style={{ 
                                      opacity: isDisabled ? 0.5 : 1,
                                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                                    }}
                                    title={isDisabled ? `Remaining is ${currentRemaining.toFixed(2)} gallons. Cannot select more containers.` : ''}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{container.name || 'Unnamed'}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{capacity || 0}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{count}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                  <div>
                                    {cappedTotal > 0 ? Number(cappedTotal.toFixed(2)) : 0}
                                    {partialFillNote && (
                                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        ({partialFillNote})
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Enable "Use Old" to select existing empty containers</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DSP Modal */}
      {showDSPModal && (
        <AddEditDSPModal
          isOpen={showDSPModal}
          onClose={() => setShowDSPModal(false)}
          mode="add"
          onSave={handleNewDSPCreated}
        />
      )}
    </div>
  );
};

export default TransferInBoundView;

