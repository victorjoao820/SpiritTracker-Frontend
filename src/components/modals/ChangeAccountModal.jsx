import { useState } from "react";

// --- ChangeAccountModal ---
export const ChangeAccountModal = ({
  isOpen,
  onClose,
  container,
  onSave,
}) => {
  const [newAccount, setNewAccount] = useState("");
  const [formError, setFormError] = useState("");

  const handleAccountChange = async () => {
    setFormError("");

    if (!newAccount.trim()) {
      setFormError("Please select a new account.");
      return;
    }

    try {
      const accountData = {
        containerId: container.id,
        newAccount: newAccount.trim()
      };

      await onSave(accountData);
      onClose();
    } catch (err) {
      console.error("Account change error:", err);
      setFormError("Account change failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Change Account - {container.containerType}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Account
            </label>
            <select
              value={newAccount}
              onChange={(e) => setNewAccount(e.target.value)}
              className="w-full bg-gray-700 p-2 rounded"
            >
              <option value="">Select Account</option>
              <option value="storage">Storage</option>
              <option value="production">Production</option>
              <option value="bottling">Bottling</option>
              <option value="sampling">Sampling</option>
            </select>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Current Container Info:</h3>
            <p className="text-sm text-gray-400">
              Type: {container.containerType}
            </p>
            <p className="text-sm text-gray-400">
              Current Account: {container.account || "storage"}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleAccountChange}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Change Account
          </button>
        </div>
      </div>
    </div>
  );
};