import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../../services/api';
import { AlertTriangle, RotateCcw, Trash2, FileText } from 'lucide-react';
import Pagination from '../parts/shared/Pagination';
import Button from '../ui/Button';

const TransactionView = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

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
      ...sortedTransactions.map(t => [
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
    a.download = `transaction-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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
        <Button
          onClick={handleExport}
          variant="default"
          icon={FileText}
        >
          Export CSV
        </Button>
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
                <th className="px-6 text-center font-semibold tracking-wider whitespace-nowrap text-base" style={{ color: 'var(--text-secondary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                  <span>Type</span>
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
              {currentTransactions.map((transaction) => {
                const actionIcon = getActionIcon(transaction);
                const showUndo = canUndo(transaction) && !actionIcon;

                return (
                  <tr key={transaction.id} className="hover:opacity-70 transition-opacity" style={{ backgroundColor: 'var(--bg-card)', height: '64px', borderColor: 'var(--border-color)' }}>
                    <td className="px-6 whitespace-nowrap overflow-hidden" style={{ color: 'var(--text-tertiary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{formatDate(transaction.createdAt)}</span>
                    </td>
                    <td className="px-6 whitespace-nowrap overflow-hidden text-center" style={{ color: 'var(--text-primary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{transaction.transactionType}</span>
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
                    <td className="px-6 whitespace-nowrap overflow-hidden text-center" style={{ color: 'var(--text-primary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{transaction.product?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 whitespace-nowrap overflow-hidden text-center" style={{ color: 'var(--text-primary)', height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{transaction.proof || '0'}</span>
                    </td>
                    <td className={`px-6 whitespace-nowrap overflow-hidden text-center ${getDeltaColor(transaction.volumeGallons)}`} style={{ height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{transaction.volumeGallons ? Number(transaction.volumeGallons).toFixed(2) : '0.00'}</span>
                    </td>
                    <td className={`px-6 whitespace-nowrap overflow-hidden text-center ${getDeltaColor(transaction.proofGallons)}`} style={{ height: '64px', maxHeight: '64px', lineHeight: '64px' }}>
                      <span className="block truncate">{transaction.proofGallons ? Number(transaction.proofGallons).toFixed(2) : '0.00'}</span>
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
          totalItems={sortedTransactions.length}
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
