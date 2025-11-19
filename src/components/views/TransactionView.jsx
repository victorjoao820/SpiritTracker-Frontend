import React, { useState, useEffect } from 'react';
import { transactionsAPI, transferInboundAPI, transferOutboundAPI } from '../../services/api';
import { AlertTriangle, RotateCcw, Trash2, FileText } from 'lucide-react';
import Pagination from '../parts/shared/Pagination';
import Button from '../ui/Button';

const TransactionView = () => {
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [logType, setLogType] = useState('Inventory Log');
  const [wareLogFilter, setWareLogFilter] = useState('ALL'); // 'ALL', 'BOTTLING', 'SALE'
  const [inventoryLogFilter, setInventoryLogFilter] = useState('ALL'); // 'ALL', 'Create', 'Edit', 'Proof Down', 'Transfer'

  useEffect(() => {
    const loadData = async () => {
      if (logType === 'TIB In Log' || logType === 'TIB Out Log' || logType === 'Ware Log') {
        try {
          setIsLoading(true);
          if (logType === 'TIB In Log') {
            const response = await transferInboundAPI.getAll();
            const transfersData = response.transfers || response || [];
            setTransfers(transfersData);
          } else if (logType === 'TIB Out Log') {
            const response = await transferOutboundAPI.getAll();
            const transfersData = response.transfers || response || [];
            setTransfers(transfersData);
          } else if (logType === 'Ware Log') {
            // Fetch both transactions (for bottling) and outbound transfers (for PRODUCTION SALE)
            const [transactionsResponse, transfersResponse] = await Promise.all([
              transactionsAPI.getAll({ limit: 1000 }),
              transferOutboundAPI.getAll()
            ]);
            const transactionsData = transactionsResponse.transactions || transactionsResponse || [];
            setTransactions(transactionsData);
            const transfersData = transfersResponse.transfers || transfersResponse || [];
            setTransfers(transfersData);
          }
          setError('');
        } catch (err) {
          console.error('Error fetching data:', err);
          setError('Failed to fetch data.');
        } finally {
          setIsLoading(false);
        }
      } else {
        await fetchTransactions();
      }
    };
    loadData();
  }, [logType]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await transactionsAPI.getAll({ limit: 1000 });
      setTransactions(response.transactions || response || []);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions.');
    } finally {
      setIsLoading(false);
    }
  };


  const toggleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  // Helper function to check if transaction is from Transfer Inbound
  const isTransferInboundTransaction = (transaction) => {
    const notes = transaction.notes || '';
    const containerNotes = transaction.container?.notes || '';
    // Check if notes contain TIB- or Transfer Inbound references
    return notes.includes('TIB-') || 
           notes.includes('Transfer Inbound') || 
           notes.includes('Created from Transfer Inbound') ||
           notes.includes('Filled from Transfer Inbound') ||
           containerNotes.includes('Created from Transfer Inbound TIB-') ||
           containerNotes.includes('Filled from Transfer Inbound TIB-');
  };

  // Helper function to check if transaction is from Transfer Outbound
  const isTransferOutboundTransaction = (transaction) => {
    const notes = transaction.notes || '';
    const containerNotes = transaction.container?.notes || '';
    // Check if notes contain TOB- or Transfer Outbound references
    return notes.includes('TOB-') || 
           notes.includes('Transfer Outbound') ||
           notes.includes('Transferred out TOB-') ||
           containerNotes.includes('Transferred out TOB-');
  };

  // Helper function to format value with direction indicator for Inventory Log
  const formatValueWithDirection = (transaction, valueType) => {
    // Only apply direction indicators for Inventory Log
    if (logType !== 'Inventory Log') {
      return valueType === 'proof' 
        ? (transaction.proof || '0')
        : valueType === 'volumeGallons'
        ? (transaction.volumeGallons ? Number(transaction.volumeGallons).toFixed(2) : '0.00')
        : (transaction.proofGallons ? Number(transaction.proofGallons).toFixed(2) : '0.00');
    }

    const transactionType = transaction.transactionType;

    // For PROOF_DOWN: parse notes to get old proof and calculate delta
    if (transactionType === 'PROOF_DOWN' && valueType === 'proof') {
      const notes = transaction.notes || '';
      // Parse: "Proof down ${oldProof} -> ${newProof}"
      const match = notes.match(/Proof down ([\d.]+) -> ([\d.]+)/);
      if (match) {
        const oldProof = parseFloat(match[1]);
        const newProof = parseFloat(match[2]);
        const delta = newProof - oldProof; // This will be negative (e.g., -10)
        return delta >= 0 ? `+${delta.toFixed(2)}` : `${delta.toFixed(2)}`;
      }
      // Fallback: show new proof if parsing fails
      return transaction.proof || '0';
    }

    // For PROOF_DOWN: volumeGallons stores the net weight change (newNetWeight - oldNetWeight in lbs)
    // This represents the increase in net weight, so it should be positive
    if (transactionType === 'PROOF_DOWN' && valueType === 'volumeGallons') {
      const value = parseFloat(transaction.volumeGallons) || 0;
      // The value is already the change (positive for increase)
      return value > 0 ? `+${value.toFixed(2)}` : value < 0 ? `${value.toFixed(2)}` : '0.00';
    }

    // For CREATE transactions: values are positive (adding)
    if (['CREATE_EMPTY_CONTAINER', 'CREATE_FILLED_CONTAINER'].includes(transactionType)) {
      const value = valueType === 'proof'
        ? parseFloat(transaction.proof) || 0
        : valueType === 'volumeGallons'
        ? parseFloat(transaction.volumeGallons) || 0
        : parseFloat(transaction.proofGallons) || 0;
      return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    }

    // For TRANSFER_IN: values are positive (adding)
    if (transactionType === 'TRANSFER_IN') {
      const value = valueType === 'proof'
        ? parseFloat(transaction.proof) || 0
        : valueType === 'volumeGallons'
        ? parseFloat(transaction.volumeGallons) || 0
        : parseFloat(transaction.proofGallons) || 0;
      return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    }

    // For TRANSFER_OUT: values are negative (removing)
    if (transactionType === 'TRANSFER_OUT') {
      const value = valueType === 'proof'
        ? parseFloat(transaction.proof) || 0
        : valueType === 'volumeGallons'
        ? parseFloat(transaction.volumeGallons) || 0
        : parseFloat(transaction.proofGallons) || 0;
      return value > 0 ? `-${value.toFixed(2)}` : value.toFixed(2);
    }

    // For EDIT transactions: typically show as positive (corrections/adjustments)
    if (['EDIT_EMPTY_DATA_CORRECTION', 'EDIT_FILL_DATA_CORRECTION', 'EDIT_FILL_FROM_EMPTY', 'EDIT_EMPTY_FROM_FILLED', 'REFILL_CONTAINER'].includes(transactionType)) {
      const value = valueType === 'proof'
        ? parseFloat(transaction.proof) || 0
        : valueType === 'volumeGallons'
        ? parseFloat(transaction.volumeGallons) || 0
        : parseFloat(transaction.proofGallons) || 0;
      return value > 0 ? `+${value.toFixed(2)}` : value < 0 ? `${value.toFixed(2)}` : value.toFixed(2);
    }

    // Default: show value as-is (no sign for zero, positive with +, negative with -)
    const value = valueType === 'proof'
      ? parseFloat(transaction.proof) || 0
      : valueType === 'volumeGallons'
      ? parseFloat(transaction.volumeGallons) || 0
      : parseFloat(transaction.proofGallons) || 0;
    
    if (value === 0) return '0.00';
    return value > 0 ? `+${value.toFixed(2)}` : `${value.toFixed(2)}`;
  };

  // Filter transactions based on selected log type
  const filterTransactions = (transactions) => {
    if (logType === 'Inventory Log') {
      // Show all transactions except TIB In/Out, Production (Fermentation/Distillation), and Bottling
      let filtered = transactions.filter(t => {
        const isTIBIn = isTransferInboundTransaction(t);
        const isTIBOut = isTransferOutboundTransaction(t);
        const isProduction = ['FERMENTATION_FINISH', 'FERMENTATION_START', 'DISTILLATION_FINISH', 'DISTILLATION_START'].includes(t.transactionType);
        const isBottling = ['BOTTLE_KEEP', 'BOTTLE_EMPTY', 'BOTTLING_GAIN', 'BOTTLING_LOSS'].includes(t.transactionType);
        return !isTIBIn && !isTIBOut && !isProduction && !isBottling;
      });

      // Apply inventory log filter
      if (inventoryLogFilter === 'Create') {
        filtered = filtered.filter(t => 
          ['CREATE_EMPTY_CONTAINER', 'CREATE_FILLED_CONTAINER'].includes(t.transactionType)
        );
      } else if (inventoryLogFilter === 'Edit') {
        filtered = filtered.filter(t => 
          ['EDIT_EMPTY_DATA_CORRECTION', 'EDIT_FILL_DATA_CORRECTION', 'EDIT_FILL_FROM_EMPTY', 'EDIT_EMPTY_FROM_FILLED', 'REFILL_CONTAINER'].includes(t.transactionType)
        );
      } else if (inventoryLogFilter === 'Proof Down') {
        filtered = filtered.filter(t => 
          ['PROOF_DOWN'].includes(t.transactionType)
        );
      } else if (inventoryLogFilter === 'Transfer') {
        filtered = filtered.filter(t => 
          ['TRANSFER_IN', 'TRANSFER_OUT'].includes(t.transactionType)
        );
      }
      // 'ALL' shows all filtered transactions (no additional filtering)

      return filtered;
    } else if (logType === 'Ware Log') {
      // Show only bottling transactions
      return transactions.filter(t => {
        return ['BOTTLE_KEEP', 'BOTTLE_EMPTY', 'BOTTLING_GAIN', 'BOTTLING_LOSS'].includes(t.transactionType);
      });
    }
    return transactions;
  };

  // Convert transfer to display format (similar to transaction format)
  const convertTransferToDisplay = (transfer) => {
    // Calculate proof gallons: volumeGallons * proof / 100
    const volumeGallons = parseFloat(transfer.volumeGallons || 0);
    const proof = parseFloat(transfer.proof || 0);
    const proofGallons = (volumeGallons * proof) / 100;
    
    return {
      id: transfer.id,
      createdAt: transfer.transferDate || transfer.createdAt,
      transactionType: `TRANSFER_${transfer.direction}`,
      container: transfer.container ? {
        id: transfer.container.id,
        name: transfer.container.name || 'N/A',
        type: transfer.container.type || 'N/A',
        containerKind: transfer.container.containerKind
      } : null,
      containerId: transfer.containerId,
      product: null, // Transfers don't have product directly
      proof: proof,
      volumeGallons: volumeGallons,
      proofGallons: proofGallons,
      notes: transfer.notes || '',
      transferNumber: transfer.transferNumber,
      destination: transfer.destination,
      carrier: transfer.carrier,
      status: transfer.status
    };
  };

  // Get data to display based on log type
  const getDisplayData = () => {
    if (logType === 'TIB In Log' || logType === 'TIB Out Log') {
      // Convert transfers to display format
      const displayData = transfers.map(convertTransferToDisplay);
      return displayData;
    } else if (logType === 'Ware Log') {
      // Combine bottling transactions, PRODUCTION SALE, and PRODUCT SALE transfers
      const bottlingTransactions = filterTransactions(transactions);
      // Filter outbound transfers for PRODUCTION SALE and PRODUCT SALE
      const saleTransfers = transfers
        .filter(t => t.direction === 'OUTBOUND' && t.notes && (
          t.notes.includes('PRODUCTION SALE') || t.notes.includes('PRODUCT SALE')
        ))
        .map(convertTransferToDisplay);
      
      // Filter based on wareLogFilter
      if (wareLogFilter === 'BOTTLING') {
        return bottlingTransactions;
      } else if (wareLogFilter === 'SALE') {
        return saleTransfers;
      } else {
        // ALL: Combine both
        return [...bottlingTransactions, ...saleTransfers];
      }
    } else {
      // Use filtered transactions
      const filteredTransactions = filterTransactions(transactions);
      return filteredTransactions;
    }
  };

  const displayData = getDisplayData();

  const sortedData = [...displayData].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getDeltaColor = (value) => {
    const numValue = parseFloat(value);
    if (numValue > 0) return 'text-green-400';
    if (numValue < 0) return 'text-red-400';
    return 'text-gray-300';
  };

  // Helper function to get proof delta value for color calculation (for Inventory Log)
  const getProofDeltaValue = (transaction) => {
    // Only calculate delta for Inventory Log
    if (logType !== 'Inventory Log') {
      return parseFloat(transaction.proof) || 0;
    }

    const transactionType = transaction.transactionType;

    // For PROOF_DOWN: parse notes to get old proof and calculate delta
    if (transactionType === 'PROOF_DOWN') {
      const notes = transaction.notes || '';
      // Parse: "Proof down ${oldProof} -> ${newProof}"
      const match = notes.match(/Proof down ([\d.]+) -> ([\d.]+)/);
      if (match) {
        const oldProof = parseFloat(match[1]);
        const newProof = parseFloat(match[2]);
        const delta = newProof - oldProof; // This will be negative (e.g., -10)
        return delta;
      }
      // Fallback: return new proof if parsing fails
      return parseFloat(transaction.proof) || 0;
    }

    // For TRANSFER_OUT: values are negative (removing)
    if (transactionType === 'TRANSFER_OUT') {
      const value = parseFloat(transaction.proof) || 0;
      return value > 0 ? -value : value; // Make it negative for color
    }

    // For CREATE, TRANSFER_IN, EDIT: values are positive (adding/corrections)
    // Return the proof value as positive for color calculation
    const value = parseFloat(transaction.proof) || 0;
    return value;
  };

  const canUndo = (transaction) => {
    const undoableTypes = [
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'SAMPLE_ADJUST',
      'BOTTLE_PARTIAL',
      'BOTTLE_EMPTY',
      'BOTTLING_GAIN',
      'BOTTLING_LOSS',
      'PROOF_DOWN'
    ];
    return undoableTypes.includes(transaction.transactionType);
  };

  const getActionIcon = (transaction) => {
    // Check if transaction is older than 30 days
    const transactionDate = new Date(transaction.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isOld = transactionDate < thirtyDaysAgo;

    // Check if container exists
    const containerExists = transaction.containerId && transaction.container;

    // Determine icon type
    if (!canUndo(transaction)) {
      return { type: 'warning', message: 'Transaction type cannot be undone' };
    }
    if (!containerExists) {
      return { type: 'missing', message: 'Container no longer exists' };
    }
    if (isOld) {
      return { type: 'old', message: 'Transaction is older than 30 days' };
    }
    return null;
  };

  const handleUndo = async (transaction) => {
    // TODO: Implement undo functionality
    console.log('Undo transaction:', transaction);
  };

  const handleRemove = async (transaction) => {
    // TODO: Implement remove functionality
    console.log('Remove transaction:', transaction);
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Type', 'Container', 'Product', 'Proof', 'Net Wt Δ', 'PG Δ', 'Notes'],
      ...sortedData.map(t => [
        formatDate(t.createdAt),
        t.transactionType,
        t.container?.name && t.container?.type 
          ? `${t.container.name} (${t.container.type})` 
          : t.container?.name || t.container?.type || 'N/A',
        t.product?.name || 'N/A',
        t.proof || '0',
        t.volumeGallons || '0.00',
        t.proofGallons || '0.00',
        t.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${logType.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleLogTypeChange = (newLogType) => {
    setLogType(newLogType);
    setCurrentPage(1); // Reset to first page when changing log type
    // Reset filters when switching log types
    if (newLogType !== 'Ware Log') {
      setWareLogFilter('ALL');
    }
    if (newLogType !== 'Inventory Log') {
      setInventoryLogFilter('ALL');
    }
  };

  const toggleWareLogFilter = () => {
    // Cycle through: ALL -> BOTTLING -> SALE -> ALL
    const filters = ['ALL', 'BOTTLING', 'SALE'];
    const currentIndex = filters.indexOf(wareLogFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setWareLogFilter(filters[nextIndex]);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const toggleInventoryLogFilter = () => {
    // Cycle through: ALL -> Create -> Edit -> Proof Down -> Transfer -> ALL
    const filters = ['ALL', 'Create', 'Edit', 'Proof Down', 'Transfer'];
    const currentIndex = filters.indexOf(inventoryLogFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setInventoryLogFilter(filters[nextIndex]);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading transaction logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex justify-between items-center transition-colors mb-4" >
        <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-accent)' }}>Transaction Log</h2>
        <div className="flex items-center gap-4">
          <select
            value={logType}
            onChange={(e) => handleLogTypeChange(e.target.value)}
            style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-primary)' }}
            className="px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="Inventory Log">Inventory Log</option>
            <option value="TIB In Log">TIB In Log</option>
            <option value="TIB Out Log">TIB Out Log</option>
            <option value="Ware Log">Ware Log</option>
          </select>
          <Button
            onClick={handleExport}
            variant="default"
            icon={FileText}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Info Box */}
      {/* <div className="mx-6 mt-4 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          <strong>💡 Undo Feature:</strong> Transactions with red undo arrow (↩️) icons can be reversed. This includes transfers (TRANSFER_IN, TRANSFER_OUT), samples (SAMPLE_ADJUST), bottling operations (BOTTLE_PARTIAL, BOTTLE_EMPTY, BOTTLING_GAIN, BOTTLING_LOSS), and proof adjustments (PROOF_DOWN). Undoing will restore the container to its previous state and completely remove the original transaction from the log.
        </p>
      </div> */}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto" >
          <table className="min-w-full divide-y text-sm">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
              <tr style={{ height: '64px' }}>
                <th className="px-6 text-left font-semibold tracking-wider whitespace-nowrap text-base cursor-pointer hover:opacity-70 select-none" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <div className="flex items-center space-x-2" onClick={toggleSort} style={{ lineHeight: '64px', height: '64px' }}>
                    <span>Date</span>
                    <span style={{ color: 'var(--text-accent)' }}>{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  </div>
                </th>
                <th 
                  className={`px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base ${(logType === 'Ware Log' || logType === 'Inventory Log') ? 'cursor-pointer hover:opacity-70 select-none' : ''}`}
                  style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px' }}
                  onClick={(logType === 'Ware Log' || logType === 'Inventory Log') ? (logType === 'Ware Log' ? toggleWareLogFilter : toggleInventoryLogFilter) : undefined}
                >
                  <div className="flex flex-col items-center justify-center" style={{ height: '64px' }}>
                    <span>Type</span>
                    {logType === 'Ware Log' && (
                      <span className="text-xs font-bold mt-1" style={{ color: 'rgb(236, 120, 43)' }}>
                        {"<-" + wareLogFilter + "->"}
                      </span>
                    )}
                    {logType === 'Inventory Log' && (
                      <span className="text-xs font-bold mt-1" style={{ color: 'rgb(236, 120, 43)' }}>
                        {"<-" + inventoryLogFilter + "->"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Container</span>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Product</span>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Proof</span>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Net Wt Δ</span>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>PG Δ</span>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Notes</span>
                </th>
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {currentData.map((transaction) => {
                const actionIcon = getActionIcon(transaction);
                const showUndo = canUndo(transaction) && !actionIcon;

                return (
                  <tr key={transaction.id} className="hover:opacity-70 transition-opacity" style={{ backgroundColor: 'var(--bg-card)', height: '64px', borderColor: 'var(--border-color)' }}>
                    <td className="px-6 whitespace-nowrap overflow-hidden" style={{ color: 'var(--text-tertiary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{formatDate(transaction.createdAt)}</span>
                    </td>
                    <td className="px-6 whitespace-nowrap overflow-hidden text-center" style={{ color: 'var(--text-primary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">
                        {transaction.transactionType === 'TRANSFER_INBOUND' ? 'TIB In' :
                         transaction.transactionType === 'TRANSFER_OUTBOUND' ? 'TIB Out' :
                         transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 overflow-hidden text-center" style={{ color: 'var(--text-primary)', height: '64px', maxHeight: '64px' }} title={transaction.containerId}>
                      <div className="flex flex-col justify-center items-center h-full">
                        <span className="block truncate text-sm" style={{ lineHeight: '1.2' }}>
                          {transaction.container?.name || 'N/A'}
                        </span>
                        <span className="block truncate text-xs opacity-70" style={{ lineHeight: '1.2' }}>
                          {transaction.container?.type || ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 whitespace-nowrap overflow-hidden text-center"  style={{ color: 'var(--text-primary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{transaction.product?.name || 'N/A'}</span>
                    </td>
                    <td className={`px-6 whitespace-nowrap overflow-hidden text-center ${getDeltaColor(getProofDeltaValue(transaction))}`} style={{ height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{formatValueWithDirection(transaction, 'proof')}</span>
                    </td>
                    <td className={`px-6 whitespace-nowrap overflow-hidden text-center ${getDeltaColor(transaction.volumeGallons)}`} style={{ height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{formatValueWithDirection(transaction, 'volumeGallons')}</span>
                    </td>
                    <td className={`px-6 whitespace-nowrap overflow-hidden text-center ${getDeltaColor(transaction.proofGallons)}`} style={{ height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{formatValueWithDirection(transaction, 'proofGallons')}</span>
                    </td>
                    <td className="px-6 overflow-hidden text-center" style={{ color: 'var(--text-tertiary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }} title={transaction.notes}>
                      <span className="block truncate max-w-xs">{transaction.notes || ''}</span>
                    </td>
                    <td className="px-6 whitespace-nowrap text-center" style={{ height: '64px', maxHeight: '64px' }}>
                      <div className="flex space-x-2 justify-center">
                        {actionIcon && (
                          <div className="inline-flex items-center justify-center border rounded-md px-3 py-1.5 cursor-help" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }} title={actionIcon.message}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                        {showUndo && (
                          <button
                            onClick={() => handleUndo(transaction)}
                            className="inline-flex items-center justify-center font-medium rounded-md bold transition-colors duration-200 bg-transparent hover:opacity-70 border px-3 py-1.5 text-xs p-2"
                            style={{ color: 'var(--action-button)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                            title={`Reverse transaction`}
                          >
                            <RotateCcw className="w-4 h-4 text-orange-400 hover:text-orange-300 font-medium transition-colors" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(transaction)}
                          className="inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 bg-transparent hover:opacity-70 border px-3 py-1.5 text-xs p-2"
                          style={{ color: 'var(--action-button)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                          title="Remove this log entry (no container state changes)"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300 font-medium transition-colors" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
                  {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={sortedData.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
        

      </div>
    </div>
  );
};

export default TransactionView;
