import { useState } from "react";
import { logTransaction } from "../../utils/helpers";

// --- ManageProductsModal ---
export const ManageProductsModal = ({
  isOpen,
  onClose,
  products,
  onSave,
  onDelete,
}) => {
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState("");

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewProductDescription(product.description || "");
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProductName("");
    setNewProductDescription("");
    setFormError("");
  };

  const handleSaveProduct = async () => {
    if (!newProductName.trim()) {
      setFormError("Product name cannot be empty.");
      return;
    }

    if (
      !editingProduct &&
      products.some(
        (p) => p.name.toLowerCase() === newProductName.trim().toLowerCase()
      )
    ) {
      setFormError(`Product "${newProductName.trim()}" already exists.`);
      return;
    }
    if (
      editingProduct &&
      editingProduct.name.toLowerCase() !==
        newProductName.trim().toLowerCase() &&
      products.some(
        (p) => p.name.toLowerCase() === newProductName.trim().toLowerCase()
      )
    ) {
      setFormError(`Product "${newProductName.trim()}" already exists.`);
      return;
    }

    const productData = {
      name: newProductName.trim(),
      description: newProductDescription.trim(),
    };

    try {
      if (editingProduct) {
        await onSave(editingProduct.id, productData);
        logTransaction({
          transactionType: "UPDATE_PRODUCT",
          productId: editingProduct.id,
          productName: productData.name,
          notes: "Product details updated.",
        });
      } else {
        await onSave(null, productData);
        logTransaction({
          transactionType: "ADD_PRODUCT",
          productName: productData.name,
          notes: "New product added.",
        });
      }
      handleCancelEdit();
    } catch (err) {
      console.error("Save product error:", err);
      setFormError("Failed to save product.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-semibold mb-6 text-blue-300">
          {editingProduct ? "Edit Product" : "Manage Spirit Products"}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Enter product name"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newProductDescription}
              onChange={(e) => setNewProductDescription(e.target.value)}
              placeholder="Enter product description"
              rows="3"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

          <div className="flex justify-end space-x-3">
            {editingProduct && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel Edit
              </button>
            )}
            <button
              onClick={handleSaveProduct}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              {editingProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>

        <hr className="my-4 border-gray-700" />

        <div className="flex-grow overflow-y-auto pr-2">
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Existing Products:
          </h3>
          {products.length === 0 && (
            <p className="text-gray-500">No products defined yet.</p>
          )}
          <ul className="space-y-3">
            {products.map((product) => (
              <li
                key={product.id}
                className="bg-gray-700 p-3 rounded-lg flex justify-between items-start"
              >
                <div className="flex-grow">
                  <h4 className="font-medium text-white">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-gray-300 mt-1">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};