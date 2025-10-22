import { useState, useEffect } from "react";
import { productsAPI } from "../../services/api";

export const AddEditProductModal = ({ isOpen, onClose, onSave, mode = "add", product = null }) => {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState("");

  // Fetch existing products
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Handle external edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductDescription(product.description || "");
      setFormError("");
    } else if (isOpen && mode === "add") {
      // Reset form for add mode
      setEditingProduct(null);
      setProductName("");
      setProductDescription("");
      setFormError("");
    }
  }, [isOpen, mode, product]);

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const handleAddProduct = async () => {
    if (!productName.trim()) {
      setFormError("Product name is required.");
      return;
    }
    try {
      const newProduct = await productsAPI.create({
        name: productName,
        description: productDescription,
      });
      setProducts(prev => [...prev, newProduct]);
      setProductName("");
      setProductDescription("");
      setFormError("");
      
      // Call the parent's onSave callback to update the parent component
      if (onSave) {
        onSave(newProduct);
      }
    } catch (err) {
      console.error("Add product error:", err);
      setFormError("Failed to add product.");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductDescription(product.description || "");
    setFormError("");
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProductName("");
    setProductDescription("");
    setFormError("");
  };

  const handleSaveChanges = async () => {
    if (!productName.trim()) {
      setFormError("Product name is required.");
      return;
    }
    try {
      const updatedProduct = await productsAPI.update(editingProduct.id, {
        name: productName,
        description: productDescription,
      });
      setProducts(prev =>
        prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      handleCancelEdit();
      
      // Call the parent's onSave callback to update the parent component
      if (onSave) {
        onSave(updatedProduct);
      }
    } catch (err) {
      console.error("Save changes error:", err);
      setFormError("Failed to save changes.");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await productsAPI.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if (editingProduct?.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Delete product error:", err);
      setFormError("Failed to delete product.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-semibold mb-6 text-blue-300">
          {mode === "edit" ? "Edit Product" : "Manage Spirit Products"}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="newProductName" className="block text-sm font-medium text-gray-300">Product Name</label>
            <input
              id="newProductName"
              placeholder="Enter Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-1 w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              type="text"
            />
          </div>
          <div>
            <label htmlFor="newProductDescription" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="newProductDescription"
              placeholder="Enter or generate product description"
              rows="3"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="mt-1 w-full bg-gray-700 border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            {!editingProduct ? (
              <button
                onClick={handleAddProduct}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Add Product
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md"
                >
                  Cancel Edit
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        <hr className="my-4 border-gray-700" />

        {/* Existing Products */}
        <div className="flex-grow overflow-y-auto pr-2">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Existing Products:</h3>
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 bg-gray-700 p-3 rounded-md">
                <div className="flex-1">
                  <p className="text-gray-100 font-semibold">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.description}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                  <button
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold uppercase"
                    onClick={() => handleEditProduct(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400 text-xs font-semibold uppercase"
                    onClick={() => handleDeleteProduct(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};