import React, { useState, useEffect, useCallback } from 'react';
import { transferOutboundAPI, containersAPI, dspsAPI, productsAPI, bottlingRunsAPI } from '../../services/api';
import { AddEditDSPModal } from '../modals';
import Pagination from '../parts/shared/Pagination';

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

const TransferOutBoundView = () => {
  // Reason options
  const reasonOptions = [
    { value: 'BULK SALE', label: 'Spirit Sale' },
    { value: 'PRODUCT SALE', label: 'Product Sale' },
    { value: 'RETURN', label: 'Return' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Conveyance options
  const conveyanceOptions = [
    { value: 'MOTOR', label: 'Motor' },
    { value: 'RAIL', label: 'Rail' },
    { value: 'AIR', label: 'Air' },
    { value: 'WATER', label: 'Water' },
  ];

  const [formData, setFormData] = useState({
    tibOutNumber: '1',
    toDSP: '',
    reason: '',
    conveyance: '',
    timestamp: getTodayDateTime(),
    note: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Container selection state
  const [containers, setContainers] = useState([]);
  const [bottlingRuns, setBottlingRuns] = useState([]);
  const [selectedContainers, setSelectedContainers] = useState({}); // { containerId: { count: 1, cost: 0, shippingCost: 0 } }
  const [dsps, setDsps] = useState([]);
  const [products, setProducts] = useState([]);
  const [showDSPModal, setShowDSPModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const productsData = await productsAPI.getAll();
      setProducts(productsData || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle new DSP creation
  const handleNewDSPCreated = async (newDSP) => {
    await fetchDSPs();
    if (newDSP && newDSP.name) {
      setFormData(prev => ({ ...prev, toDSP: newDSP.name }));
    }
    setShowDSPModal(false);
  };

  // Fetch filled containers
  const fetchContainers = useCallback(async () => {
    try {
      setIsLoading(true);
      const containersData = await containersAPI.getAll();
      // Filter only FILLED containers that haven't been transferred
      const filled = containersData.filter(container => 
        container.status === 'FILLED' && 
        !(container.notes && container.notes.includes('Transferred out TOB-'))
      );
      setContainers(filled);
    } catch (err) {
      console.error('Error fetching containers:', err);
      setError('Failed to fetch containers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  // Fetch bottling runs
  const fetchBottlingRuns = useCallback(async () => {
    try {
      setIsLoading(true);
      const bottlingRunsData = await bottlingRunsAPI.getAll();
      // Filter only completed bottling runs
      const completed = (bottlingRunsData || []).filter(run => run.status === 'COMPLETED');
      setBottlingRuns(completed);
    } catch (err) {
      console.error('Error fetching bottling runs:', err);
      setError('Failed to fetch bottling runs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch bottling runs when reason is PRODUCT SALE
  useEffect(() => {
    if (formData.reason === 'PRODUCT SALE') {
      fetchBottlingRuns();
    }
  }, [formData.reason, fetchBottlingRuns]);

  // Helper function to check if container was created/updated from Transfer Inbound
  const isFromTransferInbound = (container) => {
    return container.notes && (
      container.notes.includes('Created from Transfer Inbound TIB-') ||
      container.notes.includes('Filled from Transfer Inbound TIB-')
    );
  };

  // Extract TIB number from notes for grouping
  const getTIBNumber = (notes) => {
    if (!notes) return null;
    const match = notes.match(/(?:Created|Filled) from Transfer Inbound TIB-(\d+)/);
    return match ? match[1] : null;
  };

  // Filter containers based on selected reason
  const filteredContainers = containers.filter(container => {
    // If no reason selected, show all containers
    if (!formData.reason) return true;
    
    // If "BULK SALE" is selected, show only containers from Transfer Inbound
    if (formData.reason === 'BULK SALE') {
      return isFromTransferInbound(container);
    }
    
    // If "PRODUCTION SALE" is selected, show only production containers (NOT from Transfer Inbound)
    if (formData.reason === 'PRODUCTION SALE') {
      return !isFromTransferInbound(container);
    }
    
    // For other reasons (RETURN, OTHER), show all containers
    return true;
  });

  // Separate containers: those from Transfer Inbound (to be grouped) and others (individual)
  const transferInboundContainers = [];
  const individualContainers = [];
  
  filteredContainers.forEach(container => {
    if (isFromTransferInbound(container)) {
      transferInboundContainers.push(container);
    } else {
      individualContainers.push(container);
    }
  });

  // Group Transfer Inbound containers by containerKindId AND TIB number
  // (so containers from same transfer and same type are grouped together)
  const groupedTransferContainers = transferInboundContainers.reduce((groups, container) => {
    const tibNumber = getTIBNumber(container.notes);
    const key = `${container.containerKindId || `no-kind-${container.type || 'unknown'}`}-TIB-${tibNumber || 'unknown'}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(container);
    return groups;
  }, {});

  // Convert grouped containers to array of group objects
  const transferContainerGroups = Object.entries(groupedTransferContainers).map(([key, containers]) => {
    const firstContainer = containers[0];
    // Use sameCount if available - this represents how many containers this record represents
    const sameCount = firstContainer?.sameCount ? parseFloat(firstContainer.sameCount) : null;
    // If sameCount exists, use it as the available count; otherwise use actual container count
    const availableCount = sameCount || containers.length;
    
    return {
      key,
      containers,
      containerKindId: firstContainer?.containerKindId,
      type: firstContainer?.type,
      count: availableCount, // Available containers (from sameCount or actual count)
      sameCount: sameCount, // Original total count from creation (if exists)
      isGrouped: true, // Mark as grouped
      // Use first container as representative for display
      representative: firstContainer
    };
  });

  // Convert individual containers to group-like objects (single container per group)
  const individualContainerGroups = individualContainers.map(container => ({
    key: container.id,
    containers: [container],
    containerKindId: container.containerKindId,
    type: container.type,
    count: 1,
    isGrouped: false, // Mark as individual
    representative: container
  }));

  // Combine both arrays
  const containerGroups = [...transferContainerGroups, ...individualContainerGroups];

  // Convert bottling runs to group-like objects for PRODUCT SALE
  const bottlingRunGroups = bottlingRuns.map(run => ({
    key: run.id,
    bottlingRun: run,
    bottlesAvailable: run.bottlesProduced || 0,
    count: run.bottlesProduced || 0, // Available bottles
    isBottlingRun: true, // Mark as bottling run
    representative: {
      id: run.id,
      name: run.batchNumber || `Bottling Run ${run.id}`,
      type: 'Bottling Run',
      proof: run.proof,
      productId: run.productId,
      bottleSize: run.bottleSize,
      volumeGallons: run.volumeGallons,
      startDate: run.startDate,
      endDate: run.endDate
    }
  }));

  // Determine which groups to display based on reason
  const displayGroups = formData.reason === 'PRODUCT SALE' ? bottlingRunGroups : containerGroups;

  // Sort groups by date
  displayGroups.sort((a, b) => {
    const dateA = a.representative.fillDate || a.representative.startDate || a.representative.endDate;
    const dateB = b.representative.fillDate || b.representative.startDate || b.representative.endDate;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Calculate pagination
  const totalPages = Math.ceil(displayGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContainers = displayGroups.slice(startIndex, endIndex);

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page and clear selections when reason changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedContainers({}); // Clear selections when reason changes
  }, [formData.reason]);

  // Reset to first page when containers change
  useEffect(() => {
    setCurrentPage(1);
  }, [containers.length]);

  // Fetch next transfer number
  const fetchNextTransferNumber = useCallback(async () => {
    try {
      const response = await transferOutboundAPI.getAll();
      const nextTransferNumber = response.nextTransferNumber;
      if (nextTransferNumber) {
        setFormData(prev => ({
          ...prev,
          tibOutNumber: nextTransferNumber.toString()
        }));
      }
    } catch (err) {
      console.error('Error fetching next transfer number:', err);
    }
  }, []);

  useEffect(() => {
    fetchNextTransferNumber();
  }, [fetchNextTransferNumber]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContainerToggle = (groupKey) => {
    setSelectedContainers(prev => {
      const newSelected = { ...prev };
      if (newSelected[groupKey]) {
        delete newSelected[groupKey];
      } else {
        newSelected[groupKey] = {
          count: 1,
          cost: 0,
          shippingCost: 0
        };
      }
      return newSelected;
    });
  };

  const handleContainerFieldChange = (groupKey, field, value) => {
    setSelectedContainers(prev => {
      const newSelected = { ...prev };
      if (newSelected[groupKey]) {
        let newValue = field === 'count' ? parseInt(value) || 0 : parseFloat(value) || 0;
        
        // Validate count doesn't exceed group count
        if (field === 'count') {
          const group = displayGroups.find(g => g.key === groupKey);
          if (group && newValue > group.count) {
            newValue = group.count;
          }
          if (newValue < 1) {
            newValue = 1;
          }
        }
        
        newSelected[groupKey] = {
          ...newSelected[groupKey],
          [field]: newValue
        };
      }
      return newSelected;
    });
  };

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      // Validation
      if (!formData.tibOutNumber.trim()) {
        setError('TIB Out Number is required');
        setIsSaving(false);
        return;
      }
      if (!formData.toDSP) {
        setError('To DSP is required');
        setIsSaving(false);
        return;
      }
      if (!formData.reason) {
        setError('Reason is required');
        setIsSaving(false);
        return;
      }
      if (!formData.conveyance) {
        setError('Conveyance is required');
        setIsSaving(false);
        return;
      }
      if (Object.keys(selectedContainers).length === 0) {
        setError(`Please select at least one ${formData.reason === 'PRODUCT SALE' ? 'bottling run' : 'container'}`);
        setIsSaving(false);
        return;
      }

      // Create ONE transfer per selected group (container or bottling run)
      const transferPromises = [];
      const containerUpdatePromises = [];
      
      Object.entries(selectedContainers).forEach(([groupKey, data]) => {
        // Find the group
        const group = displayGroups.find(g => g.key === groupKey);
        if (!group) return;

        // Handle bottling runs differently
        if (group.isBottlingRun) {
          const bottlingRun = group.bottlingRun;
          const selectedBottles = data.count || 1;
          const availableBottles = group.bottlesAvailable;
          const actualSelectedBottles = Math.min(selectedBottles, availableBottles);
          
          // Convert bottle size from mL to gallons for volume calculation
          // bottleSize is in mL, convert to gallons: 1 mL = 0.000264172 gallons
          const bottleSizeGallons = (parseFloat(bottlingRun.bottleSize) * 0.000264172) || 0;
          const totalVolumeGallons = bottleSizeGallons * actualSelectedBottles;
          
          // Build notes
          let notes = `${formData.reason}${formData.note ? ` | ${formData.note}` : ''}`;
          notes += ` | Bottling Run: ${bottlingRun.batchNumber}`;
          notes += ` | Bottles: ${actualSelectedBottles} of ${availableBottles}`;
          notes += ` | Bottle Size: ${bottlingRun.bottleSize} mL`;
          if (data.cost > 0) notes += ` | Cost: ${data.cost}`;
          if (data.shippingCost > 0) notes += ` | Shipping Cost: ${data.shippingCost}`;
          
          // Create transfer for bottling run
          const transferData = {
            transferNumber: formData.tibOutNumber,
            transferType: 'CONTAINER', // Using CONTAINER type for now
            direction: 'OUTBOUND',
            containerId: null, // No container for bottling runs
            destination: formData.toDSP,
            volumeGallons: totalVolumeGallons,
            proof: bottlingRun.proof || 0,
            transferDate: new Date(formData.timestamp).toISOString(),
            carrier: formData.conveyance,
            notes: notes
          };
          
          transferPromises.push(transferOutboundAPI.create(transferData));
          return; // Skip container update logic for bottling runs
        }

        const selectedCount = data.count || 1;
        const totalAvailable = group.count; // Available containers (from sameCount or actual count)
        const originalTotalCount = group.sameCount || totalAvailable;
        
        // Validate selected count doesn't exceed available
        const actualSelectedCount = Math.min(selectedCount, totalAvailable);
        const remainingCount = totalAvailable - actualSelectedCount;
        
        // Get the container record(s) - if sameCount exists, we're working with one record representing multiple
        const containerRecord = group.containers[0];
        const containerKind = containerRecord.containerKind;
        const capacityGallons = containerKind?.capacityGallons ? parseFloat(containerKind.capacityGallons) : 0;
        
        // Calculate total volume gallons: capacity * number of containers being transferred
        const totalVolumeGallons = capacityGallons * actualSelectedCount;
        const containerName = containerRecord.name || 'Unnamed';
        const containerType = containerRecord.type || 'container';
        const containerKindName = containerKind?.name || containerType;
        
        // Build detailed notes with container information
        let notes = `${formData.reason}${formData.note ? ` | ${formData.note}` : ''}`;
        notes += ` | Container Group: ${containerKindName}`;
        notes += ` | Count: ${actualSelectedCount}${originalTotalCount > actualSelectedCount ? ` of ${originalTotalCount}` : ''}`;
        notes += ` | Container: ${containerName}`;
        if (data.cost > 0) notes += ` | Cost: ${data.cost}`;
        if (data.shippingCost > 0) notes += ` | Shipping Cost: ${data.shippingCost}`;
        if (remainingCount > 0) {
          notes += ` | Remaining: ${remainingCount}`;
        }
        
        // Create ONE transfer for this group
        const transferData = {
          transferNumber: formData.tibOutNumber,
          transferType: 'CONTAINER',
          direction: 'OUTBOUND',
          containerId: containerRecord.id, // Reference to container record
          destination: formData.toDSP,
          volumeGallons: totalVolumeGallons,
          proof: containerRecord.proof || 0,
          transferDate: new Date(formData.timestamp).toISOString(),
          carrier: formData.conveyance,
          notes: notes
        };

        transferPromises.push(transferOutboundAPI.create(transferData));
        
        // Update container based on whether all or partial transfer
        if (remainingCount > 0) {
          // Partial transfer: update sameCount to remaining count
          const transferNote = `Transferred out TOB-${formData.tibOutNumber} on ${new Date(formData.timestamp).toLocaleDateString()} (${actualSelectedCount} of ${originalTotalCount})`;
          const updatedNotes = containerRecord.notes 
            ? `${containerRecord.notes}; ${transferNote}`
            : transferNote;
          
          containerUpdatePromises.push(
            containersAPI.update(containerRecord.id, {
              sameCount: remainingCount,
              notes: updatedNotes
            })
          );
        } else {
          // All containers transferred: mark as transferred
          const transferNote = `Transferred out TOB-${formData.tibOutNumber} on ${new Date(formData.timestamp).toLocaleDateString()}`;
          const updatedNotes = containerRecord.notes 
            ? `${containerRecord.notes}; ${transferNote}`
            : transferNote;
          
          containerUpdatePromises.push(
            containersAPI.update(containerRecord.id, {
              notes: updatedNotes
            })
          );
        }
      });

      // Execute all transfers and container updates
      await Promise.all([...transferPromises, ...containerUpdatePromises]);
      
      // Refresh data based on reason
      if (formData.reason === 'PRODUCT SALE') {
        await fetchBottlingRuns();
      } else {
        await fetchContainers();
      }

      setError('');
      const selectedGroupCount = Object.keys(selectedContainers).length;
      const totalItemsTransferred = Object.values(selectedContainers).reduce((sum, data) => sum + (data.count || 1), 0);
      const itemType = formData.reason === 'PRODUCT SALE' ? 'bottling run(s)' : 'group(s)';
      const itemUnit = formData.reason === 'PRODUCT SALE' ? 'bottle(s)' : 'container(s)';
      setSuccessMessage(`Transfer TOB-${formData.tibOutNumber} has been created successfully for ${selectedGroupCount} ${itemType} (${totalItemsTransferred} ${itemUnit} total).`);
      
      // Clear form after successful save
      setFormData({
        tibOutNumber: '',
        toDSP: '',
        reason: '',
        conveyance: '',
        timestamp: getTodayDateTime(),
        note: '',
      });
      setSelectedContainers({});
      
      // Fetch next transfer number
      await fetchNextTransferNumber();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error saving transfer outbound:', err);
      setError(err.response?.data?.error || 'Failed to save transfer outbound data.');
      setSuccessMessage('');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading transfer outbound data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
            Transfer Outbound
          </h3>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Manage transfer outbound records.
          </p>
        </div>
        <button
          onClick={handleConfirm}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Confirm'}
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

      {/* Main Content Layout: Form Fields on Left, Table on Right */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Side: Transfer Information */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-lg border p-4 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-md font-semibold mb-4 transition-colors" style={{ color: 'var(--text-primary)' }}>
              Transfer Information
            </h4>
            
            {/* Form Fields arranged in single column */}
            <div className="space-y-4">
              {/* TIB Out Number */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  TIB Out Number
                </label>
                <input
                  type="text"
                  value={formData.tibOutNumber}
                  onChange={(e) => handleFormChange('tibOutNumber', e.target.value)}
                  className="w-full p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
                  placeholder="Enter TIB Out Number"
                />
              </div>
              
              {/* To DSP */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  To DSP
                </label>
                {formData.toDSP === 'OTHER' || (formData.toDSP && !dsps.find(dsp => dsp.name === formData.toDSP)) ? (
                  <div>
                    <input
                      type="text"
                      value={formData.toDSP === 'OTHER' ? '' : formData.toDSP}
                      onChange={(e) => handleFormChange('toDSP', e.target.value)}
                      style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
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
                    value={formData.toDSP || ''}
                    onChange={(e) => handleFormChange('toDSP', e.target.value)}
                    style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
                    className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {!formData.toDSP && <option value="" disabled>-- Select DSP --</option>}
                    {dsps.map((dsp) => (
                      <option key={dsp.id} value={dsp.name}>
                        {dsp.name}
                      </option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>
                )}
              </div>
              
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Reason
                </label>
                <select
                  value={formData.reason || ''}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {!formData.reason && <option value="" disabled>-- Select Reason --</option>}
                  {reasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Conveyance */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Conveyance
                </label>
                <select
                  value={formData.conveyance || ''}
                  onChange={(e) => handleFormChange('conveyance', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {!formData.conveyance && <option value="" disabled>-- Select Conveyance --</option>}
                  {conveyanceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Timestamp */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={formData.timestamp}
                  onChange={(e) => handleFormChange('timestamp', e.target.value)}
                  style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  rows={3}
                  style={{ backgroundColor: 'var(--bg-accent)', color:'var(--text-primary)'}}
                  className="w-full bg-accent p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter notes"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Container Selection Table */}
        <div className="col-span-2">
          <div className="rounded-lg border p-4 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-md font-semibold mb-4 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {formData.reason === 'PRODUCT SALE' ? 'Bottling Run Selection' : 'Container Selection'}
            </h4>
            
            {displayGroups.length === 0 ? (
              <p className="text-sm text-gray-400">
                {formData.reason === 'PRODUCT SALE' ? 'No bottling runs available' : 'No filled containers available'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="transition-colors border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Select</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {formData.reason === 'PRODUCT SALE' ? 'Batch Number' : 'Container'}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {formData.reason === 'PRODUCT SALE' ? 'Product' : 'Spirit Type'}
                      </th>
                      {formData.reason === 'PRODUCT SALE' && (
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Bottle Size</th>
                      )}
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {formData.reason === 'PRODUCT SALE' ? 'Bottles' : 'Count'}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Cost</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>Shipping Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    {currentContainers.map((group) => {
                      const item = group.representative;
                      const isSelected = !!selectedContainers[group.key];
                      const itemData = selectedContainers[group.key] || { count: 0, cost: 0, shippingCost: 0 };
                      const product = products.find(p => p.id === item.productId);
                      const selectedCount = itemData.count || 0;
                      const isBottlingRun = group.isBottlingRun;
                      
                      return (
                        <tr key={group.key} className="transition-colors">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleContainerToggle(group.key)}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                            <div>
                              <div className="font-medium">
                                {isBottlingRun ? item.name : (item.name || 'Unnamed')}
                                {isBottlingRun && group.count > 0 && (
                                  <span className="ml-1 text-sm font-bold" style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                    (x{group.count})
                                  </span>
                                )}
                                {!isBottlingRun && group.isGrouped && (
                                  <span className="ml-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {group.sameCount && group.sameCount > group.count 
                                      ? `(${group.count} of ${group.sameCount})`
                                      : group.count > 1 
                                        ? `(x${group.count})`
                                        : ''
                                    }
                                  </span>
                                )}
                                {isSelected && selectedCount > 0 && (
                                  <span className="ml-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    -{selectedCount}
                                  </span>
                                )}
                              </div>
                              {!isBottlingRun && (
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                  {item.type || 'N/A'}
                                  {item.containerKind && ` - ${item.containerKind.name}`}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {product ? product.name : 'N/A'}
                          </td>
                          {isBottlingRun && (
                            <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                              {item.bottleSize ? `${parseFloat(item.bottleSize).toFixed(0)} mL` : 'N/A'}
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              max={group.count}
                              step="1"
                              value={isSelected ? itemData.count : ''}
                              onChange={(e) => handleContainerFieldChange(group.key, 'count', e.target.value)}
                              disabled={!isSelected}
                              style={{ backgroundColor: isSelected ? 'var(--bg-accent)' : 'var(--bg-readable)', color:'var(--text-primary)'}}
                              className="w-20 p-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="1"
                              title={isBottlingRun ? `Available: ${group.count} bottles` : (group.sameCount ? `Available: ${group.count} of ${group.sameCount} total` : `Available: ${group.count}`)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={isSelected ? itemData.cost : ''}
                              onChange={(e) => handleContainerFieldChange(group.key, 'cost', e.target.value)}
                              disabled={!isSelected}
                              style={{ backgroundColor: isSelected ? 'var(--bg-accent)' : 'var(--bg-readable)', color:'var(--text-primary)'}}
                              className="w-24 p-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={isSelected ? itemData.shippingCost : ''}
                              onChange={(e) => handleContainerFieldChange(group.key, 'shippingCost', e.target.value)}
                              disabled={!isSelected}
                              style={{ backgroundColor: isSelected ? 'var(--bg-accent)' : 'var(--bg-readable)', color:'var(--text-primary)'}}
                              className="w-24 p-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {containerGroups.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={containerGroups.length}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </div>
            )}
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

export default TransferOutBoundView;

