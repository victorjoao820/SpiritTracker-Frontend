import React, { useState, useEffect } from "react";
import { AddEditProductModal, ConfirmationModal } from "./modals";
import { productsAPI } from "../services/api";

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await productsAPI.getAll();
      setProducts(fetchedProducts);
      setError("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      // If productData is already a product object (from modal callback), use it directly

      console.log("productData", productData);
      
      if (productData.id) {
        setProducts((prev) => [...prev, productData]);
        setShowAddProductModal(false);
        setError("");
      } else {
        // If productData is raw data, create the product
        const newProduct = await productsAPI.create(productData);
        setProducts((prev) => [...prev, newProduct]);
        setShowAddProductModal(false);
        setError("");
      }
    } catch (err) {
      console.error("Error adding product:", err);
      setError("Failed to add product.");
      throw err;
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await productsAPI.delete(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      setShowConfirmModal(false);
      setProductToDelete(null);
      setError("");
      
      // Reset to first page if current page becomes empty
      const remainingProducts = products.filter((product) => product.id !== id);
      const newTotalPages = Math.ceil(remainingProducts.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product.");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddProductModal(true);
  };

  const handleUpdateProduct = async (productData) => {
    try {
      // If productData is already a product object (from modal callback), use it directly
      if (productData.id) {
        setProducts((prev) =>
          prev.map((product) =>
            product.id === productData.id ? productData : product
          )
        );
        setShowAddProductModal(false);
        setEditingProduct(null);
        setError("");
      } else {
        // If productData is raw data, update the product
        const updatedProduct = await productsAPI.update(editingProduct.id, productData);
        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProduct.id ? updatedProduct : product
          )
        );
        setShowAddProductModal(false);
        setEditingProduct(null);
        setError("");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Failed to update product.");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Spirit Products
          </h3>
          <p className="text-sm text-gray-400">
            Manage your distillery products and spirits
          </p>
        </div>
        <button
          onClick={() => setShowAddProductModal(true)}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <p className="text-gray-400 mb-4">No products found</p>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {currentProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 max-w-xs truncate">
                        {product.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(product);
                            setShowConfirmModal(true);
                          }}
                          className="text-red-400 hover:text-red-300 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-600">
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
                    <span className="font-medium">{Math.min(endIndex, products.length)}</span> of{' '}
                    <span className="font-medium">{products.length}</span> results
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
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddProductModal && (
        <AddEditProductModal
          isOpen={showAddProductModal}
          onClose={() => {
            setShowAddProductModal(false);
            setEditingProduct(null);
          }}
          mode={editingProduct ? "edit" : "add"}
          product={editingProduct}
          onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this product?"
          onCancel={() => {
            setShowConfirmModal(false);
            setProductToDelete(null);
          }}
          onConfirm={() => {
            if (productToDelete) {
              handleDeleteProduct(productToDelete.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProductsView;
