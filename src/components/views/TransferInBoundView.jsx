import React, { useState, useEffect, useCallback, useRef } from 'react';
import { transferInboundAPI, containersAPI, containerKindsAPI, productsAPI } from '../../services/api';
import CreatableSelect from 'react-select/creatable';

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

  // DSP options (can be customized)
  const dspOptions = [
    { value: 'DSP-001', label: 'DSP-001' },
    { value: 'DSP-002', label: 'DSP-002' },
    { value: 'DSP-003', label: 'DSP-003' },
    { value: 'OTHER', label: 'Other' },
  ];

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
  const [focusedField, setFocusedField] = useState(null);
  const [focusedCountInput, setFocusedCountInput] = useState(null);
  const dspSelectRef = useRef(null);
  const [dspMenuOpen, setDspMenuOpen] = useState(false);

  const fetchTransferInbound = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await transferInboundAPI.getAll();
      
      // Handle both old format (array) and new format (object with transfers and nextTransferNumber)
      const transfers = response.transfers || response;
      const nextTransferNumber = response.nextTransferNumber;
      
      // If there's existing data, load the first one
      if (transfers && Array.isArray(transfers) && transfers.length > 0) {
        const transfer = transfers[0];
        setRowData({
          tibInNumber: transfer.transferNumber || (nextTransferNumber ? nextTransferNumber.toString() : '1'),
          spiritType: transfer.productId?.toString() || '',
          fromDSP: transfer.destination || '',
          totalGallons: transfer.volumeGallons?.toString() || '',
          reason: transfer.notes || '',
          totalSpiritCost: '', // Not in model yet
          shippingCost: transfer.carrier || '',
          sealNumber: transfer.sealNumber || '',
          transferDate: transfer.transferDate ? formatDateTimeLocal(new Date(transfer.transferDate)) : getTodayDateTime(),
        });
      } else {
        // If no existing data, set the auto-generated TIB In Number
        setRowData(prev => ({
          ...prev,
          tibInNumber: nextTransferNumber ? nextTransferNumber.toString() : '1',
        }));
      }
      setError('');
    } catch (err) {
      console.error('Error fetching transfer inbound:', err);
      setError('Failed to fetch transfer inbound data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Track when totalGallons is manually changed - store as base value
  const handleTotalGallonsChange = (value) => {
    setBaseTotalGallons(value);
    isUpdatingFromCalculation.current = false;
    handleCellChange('totalGallons', value);
  };

  // Calculate total volume reduction from selected containers
  useEffect(() => {
    // Skip if we're updating from calculation or no base value
    if (isUpdatingFromCalculation.current) {
      return;
    }

    // Use baseTotalGallons if set, otherwise use current rowData.totalGallons as base
    const currentBase = baseTotalGallons || rowData.totalGallons;
    if (!currentBase) {
      return;
    }

    let totalReduction = 0;
    
    if (useNew) {
      // Calculate reduction from selected new container types with counts
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
                totalReduction += (parseFloat(kind.capacityGallons) || 0) * count;
              }
            }
          }
        }
      });
    }
    
    if (useOld) {
      // Calculate reduction from selected old containers
      selectedOldContainers.forEach(containerId => {
        const container = emptyContainers.find(c => c.id === containerId);
        if (container && container.containerKind?.capacityGallons) {
          totalReduction += parseFloat(container.containerKind.capacityGallons);
        }
      });
    }
    
    // Update Total Gallons by reducing from the base value
    const baseTotal = parseFloat(currentBase) || 0;
    if (baseTotal > 0 || totalReduction > 0) {
      const reducedTotal = Math.max(0, baseTotal - totalReduction);
      const currentTotal = parseFloat(rowData.totalGallons || 0);
      // Only update if the value actually changed
      if (Math.abs(currentTotal - reducedTotal) > 0.01) {
        isUpdatingFromCalculation.current = true;
        setRowData(prev => ({
          ...prev,
          totalGallons: reducedTotal.toString(),
        }));
        // Reset flag after update
        setTimeout(() => {
          isUpdatingFromCalculation.current = false;
        }, 0);
      }
    }
  }, [selectedNewContainers, newContainerCounts, selectedOldContainers, useNew, useOld, containerKinds, emptyContainers, baseTotalGallons, rowData.totalGallons]);

  const handleCellChange = (field, value) => {
    setRowData(prev => ({
      ...prev,
      [field]: value
    }));
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
  };

  const handleUseOldChange = (checked) => {
    setUseOld(checked);
    if (!checked) {
      // Reset selections when unchecked
      setSelectedOldContainers([]);
    }
  };

  const handleNewContainerToggle = (containerName) => {
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

      // Validation
      if (!rowData.tibInNumber.trim()) {
        setError('TIB In Number is required');
        return;
      }
      if (!rowData.fromDSP) {
        setError('From DSP is required');
        return;
      }
      if (!rowData.totalGallons || parseFloat(rowData.totalGallons) <= 0) {
        setError('Total Gallons must be a valid number > 0');
        return;
      }
      if (!rowData.reason) {
        setError('Reason is required');
        return;
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
        notes: `${rowData.reason}${rowData.totalSpiritCost ? ` | Total Spirit Cost: ${rowData.totalSpiritCost}` : ''}`,
        status: 'PENDING'
      };

      // Check if we have existing data to update or need to create
      const existingTransfers = await transferInboundAPI.getAll();
      if (existingTransfers && existingTransfers.length > 0) {
        // Update existing
        await transferInboundAPI.update(existingTransfers[0].id, transferData);
      } else {
        // Create new
        await transferInboundAPI.create(transferData);
      }

      setError('');
      // Optionally show success message
    } catch (err) {
      console.error('Error saving transfer inbound:', err);
      setError(err.response?.data?.error || 'Failed to save transfer inbound data.');
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
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <CreatableSelect
                      ref={dspSelectRef}
                      value={rowData.fromDSP ? { value: rowData.fromDSP, label: rowData.fromDSP } : null}
                      onChange={(selectedOption) => {
                        handleCellChange('fromDSP', selectedOption ? selectedOption.value : '');
                        setDspMenuOpen(false);
                      }}
                      onCreateOption={(inputValue) => {
                        handleCellChange('fromDSP', inputValue);
                        setDspMenuOpen(false);
                      }}
                      options={dspOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                      isClearable
                      isSearchable
                      isCreatable={rowData.fromDSP === 'OTHER'}
                      placeholder="-- Select DSP --"
                      formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                      menuIsOpen={dspMenuOpen}
                      onMenuOpen={() => setDspMenuOpen(true)}
                      onMenuClose={() => setDspMenuOpen(false)}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          backgroundColor: 'var(--bg-accent)',
                          borderColor: state.isFocused ? '#3b82f6' : 'var(--border-color)',
                          color: rowData.fromDSP === 'OTHER' ? 'var(--text-secondary)' : 'var(--text-primary)',
                          opacity: rowData.fromDSP === 'OTHER' ? 0.6 : 1,
                          minHeight: '42px',
                          '&:hover': {
                            borderColor: state.isFocused ? '#3b82f6' : 'var(--border-color)',
                          },
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: rowData.fromDSP === 'OTHER' ? 'var(--text-secondary)' : 'var(--text-primary)',
                          opacity: rowData.fromDSP === 'OTHER' ? 0.6 : 1,
                        }),
                        input: (base) => ({
                          ...base,
                          color: 'var(--text-primary)',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: 'var(--text-secondary)',
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: 'var(--bg-card)',
                          zIndex: 9999,
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? 'var(--bg-selected)'
                            : state.isFocused
                            ? 'var(--hover-bg)'
                            : 'var(--bg-card)',
                          color: state.isSelected && state.data.value === 'OTHER' 
                            ? 'var(--text-secondary)' 
                            : 'var(--text-primary)',
                          opacity: state.isSelected && state.data.value === 'OTHER' ? 0.6 : 1,
                          '&:hover': {
                            backgroundColor: 'var(--hover-bg)',
                          },
                        }),
                      }}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  {rowData.fromDSP === 'OTHER' && (
                    <button
                      type="button"
                      onClick={() => {
                        // Open the menu to allow typing/editing
                        setDspMenuOpen(true);
                        // Focus the select input after menu opens
                        setTimeout(() => {
                          if (dspSelectRef.current) {
                            dspSelectRef.current.focus();
                          }
                        }, 100);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                      style={{ minWidth: '40px', height: '42px' }}
                      title="Click to edit"
                    >
                      +
                    </button>
                  )}
                </div>
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
            <h4 className="text-md font-semibold mb-4 transition-colors" style={{ color: 'var(--text-primary)' }}>
              Container Selection
            </h4>
            
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
                          const total = capacity * count;
                          const checked = selectedNewContainers[containerType.name] || false;
                          const name = newContainerNames[containerType.name] || '';
                          return (
                            <tr key={containerType.name} className="transition-colors">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleNewContainerToggle(containerType.name)}
                                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
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
                              <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{Number(total)}</td>
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
                            const total = capacity * count;
                            return (
                              <tr key={container.id} className="transition-colors">
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleOldContainerToggle(container.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{container.name || 'Unnamed'}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{capacity || 0}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{count}</td>
                                <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{total.toFixed(2)}</td>
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
    </div>
  );
};

export default TransferInBoundView;

