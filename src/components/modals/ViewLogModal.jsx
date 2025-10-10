import { useState } from "react";
import { convertToCSV, downloadCSV } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";
import Button from "../ui/Button";

// --- ViewLogModal ---
export const ViewLogModal = ({
  isOpen,
  onClose,
  transactionLog,
  isLoadingLog,
}) => {
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  if (!isOpen) return null;

  const handleExportLog = () => {
    const headers = [
      "Date",
      "Type",
      "Container",
      "Product",
      "Proof",
      "Volume Change",
      "Proof Gallons Change",
      "Notes",
    ];

    const csvData = sortedTransactions.map((transaction) => [
      new Date(transaction.createdAt).toLocaleDateString(),
      transaction.transactionType,
      transaction.container?.containerType || "N/A",
      transaction.product?.name || "N/A",
      transaction.proof || 0,
      transaction.volumeGallons || 0,
      transaction.proofGallons || 0,
      transaction.notes || "",
    ]);

    const csv = convertToCSV(csvData, headers);
    downloadCSV(csv, `transaction-log-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const sortedTransactions = [...transactionLog].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-300">Transaction Log</h2>
          <div className="flex space-x-2">
            <Button onClick={handleExportLog} variant="secondary" size="sm">
              Export CSV
            </Button>
            <Button onClick={onClose} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        </div>

        {isLoadingLog ? (
          <div className="text-center py-8">Loading transaction log...</div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Container</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Proof</th>
                  <th className="p-2 text-left">Volume</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-600">
                    <td className="p-2">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2">{transaction.transactionType}</td>
                    <td className="p-2">
                      {transaction.container?.containerType || "N/A"}
                    </td>
                    <td className="p-2">
                      {transaction.product?.name || "N/A"}
                    </td>
                    <td className="p-2">{transaction.proof || 0}</td>
                    <td className="p-2">{transaction.volumeGallons || 0}</td>
                    <td className="p-2">{transaction.notes || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};