import React, { useState, useEffect } from "react";
import { AddEditProductModal, ConfirmationModal } from "../modals";
import { productsAPI } from "../../services/api";
import { ActionButtons } from "../parts/shared/ActionButtons";
import Pagination from "../parts/shared/Pagination";
import Button from "../ui/Button";
import { LiaCartPlusSolid } from "react-icons/lia";

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
          <h3 className="text-lg font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
            Spirit Products
          </h3>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Add or change new products.
          </p>
        </div>
        <Button
          onClick={() => setShowAddProductModal(true)}
          variant="default"
          icon={<LiaCartPlusSolid className="w-4 h-4 mr-2" />}
          >
          Add Product
        </Button>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-700 p-4 rounded-lg">{error}</div>}

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg p-12 text-center border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="mb-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>No products found</p>
          <Button
          onClick={() => setShowAddProductModal(true)}
          variant="default"
          icon={<LiaCartPlusSolid className="w-4 h-4 mr-2" />}
          >
          Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {currentProducts.map((product, index) => (
                  <tr key={product.id} className="transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs truncate transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                        {product.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <ActionButtons
                          onEdit={() => handleEditProduct(product)}
                          onDelete={() => {
                            setProductToDelete(product);
                            setShowConfirmModal(true);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={products.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
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
