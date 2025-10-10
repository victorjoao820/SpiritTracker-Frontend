import { useState, useEffect } from "react";
import { logTransaction } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";
import Button from "../ui/Button";

// --- TransferModal ---
export const TransferModal = ({
  isOpen,
  onClose,
  sourceContainer,
  allContainers,
  onSave,
}) => {
  const [destinationId, setDestinationId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Filter available destinations (exclude source container)
  const availableDestinations = allContainers.filter((c) => c.id !== sourceContainer.id);

  const handleTransfer = async () => {
    if (isTransferring) return;

    setFormError("");
    setIsTransferring(true);

    // Basic validation
    if (!destinationId) {
      setFormError("Please select a destination container.");
      setIsTransferring(false);
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid transfer amount.");
      setIsTransferring(false);
      return;
    }

    try {
      const transferData = {
        sourceContainerId: sourceContainer.id,
        destinationContainerId: destinationId,
        amount: amount,
        unit: "gallons" // Simplified to gallons for now
      };

      await onSave(transferData);
      
      // Log the transaction
      logTransaction({
        transactionType: TRANSACTION_TYPES.TRANSFER_OUT,
        containerId: sourceContainer.id,
        containerName: sourceContainer.containerType,
        volumeGallons: -amount,
        notes: `Transferred ${amount} gallons to container ${destinationId}`,
      });

      onClose();
    } catch (err) {
      console.error("Transfer error:", err);
      setFormError("Transfer failed: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Transfer from {sourceContainer.containerType}
        </h2>

        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Destination Container
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-gray-700 p-2 rounded"
              disabled={isTransferring}
            >
              <option value="">Select destination</option>
              {availableDestinations.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.containerType} ({container.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Transfer Amount (Gallons)
            </label>
            <input
              type="number"
              step="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Enter amount to transfer"
              className="w-full bg-gray-700 p-2 rounded"
              disabled={isTransferring}
            />
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Source Container Info:</h3>
            <p className="text-sm text-gray-400">
              Type: {sourceContainer.containerType}
            </p>
            <p className="text-sm text-gray-400">
              Status: {sourceContainer.status}
            </p>
            {sourceContainer.volumeGallons && (
              <p className="text-sm text-gray-400">
                Volume: {sourceContainer.volumeGallons} gallons
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            variant="primary"
            size="md"
            loading={isTransferring}
            disabled={isTransferring}
          >
            Confirm Transfer
          </Button>
        </div>
      </div>
    </div>
  );
};