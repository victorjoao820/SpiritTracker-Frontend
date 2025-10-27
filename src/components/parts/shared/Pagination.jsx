import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange
}) => {
  return (
    <div className="px-6 py-3 flex items-center justify-between border-t transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
      {/* Items per page selector */}
      {onItemsPerPageChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-black-400 focus:border-transparent transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>per page</span>
        </div>
      )}

      {/* Pagination controls */}
      <>
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: 'var(--border-light)', 
                color: 'var(--text-secondary)', 
                backgroundColor: 'var(--bg-card)'
              }}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: 'var(--border-light)', 
                color: 'var(--text-secondary)', 
                backgroundColor: 'var(--bg-card)'
              }}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    borderColor: 'var(--border-light)', 
                    color: 'var(--text-secondary)', 
                    backgroundColor: 'var(--bg-card)'
                  }}
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
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'z-10 bg-accent text-white'
                            : 'border-light'
                        }`}
                        style={page === currentPage
                          ? { 
                              backgroundColor: 'hsl(var(--accent))', 
                              borderColor: 'hsl(var(--accent))'
                            }
                          : { 
                              borderColor: 'var(--border-light)', 
                              color: 'var(--text-secondary)', 
                              backgroundColor: 'var(--bg-card)'
                            }
                        }
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span 
                        key={page} 
                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors"
                        style={{ 
                          borderColor: 'var(--border-light)', 
                          backgroundColor: 'var(--bg-card)', 
                          color: 'var(--text-tertiary)' 
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    borderColor: 'var(--border-light)', 
                    color: 'var(--text-secondary)', 
                    backgroundColor: 'var(--bg-card)'
                  }}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
      </>
    </div>
  );
};

export default Pagination;
