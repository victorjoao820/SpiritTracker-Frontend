import { useMemo } from "react";
import { calcGallonsFromWeight} from "../../../utils/helpers";


// --- Dashboard Component ---
export const Dashboard = ({ inventory }) => {
  const stats = useMemo(() => {
    let totalProofGallons = 0;
    let totalWineGallons = 0;
    let totalWeightLbs = 0;
    let filledCount = 0;
    const productTotals = {};

    inventory.forEach((c) => {
      if (c.status === "FILLED" && c.netWeight) {
        filledCount++;
        const product = c.product.name || "Unspecified";
        const {wineGallons, proofGallons} = calcGallonsFromWeight(c.proof, c.netWeight)
        totalProofGallons += proofGallons;
        totalWineGallons += wineGallons;
        totalWeightLbs+= Number(c.netWeight);

        if (!productTotals[product]) {
          productTotals[product] = 0;
        }
        productTotals[product] += proofGallons;
      }
    });

    const sortedProducts = Object.entries(productTotals).sort(
      ([, a], [, b]) => b - a
    );

    return {
      totalProofGallons,
      totalWineGallons,
      totalWeightLbs,
      emptyCount: inventory.length - filledCount,
      sortedProducts,
    };
  }, [inventory]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-4 border border-blue-500/30">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-300">Total Proof Gallons</p>
          <p className="text-3xl font-bold">
            {stats.totalProofGallons.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-300">Total Wine Gallons</p>
          <p className="text-3xl font-bold">
            {stats.totalWineGallons.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-300">Total Weight Lbs</p>
          <p className="text-3xl font-bold">{stats.totalWeightLbs}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-300">Empty Containers</p>
          <p className="text-3xl font-bold">{stats.emptyCount}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Inventory by Product (PG)
        </h3>
        <div className="bg-gray-700 p-4 rounded-lg">
          {stats.sortedProducts.length > 0 ? (
            <ul className="space-y-2">
              {stats.sortedProducts.map(([product, totalPg]) => (
                <li
                  key={product}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-300">{product}</span>
                  <span className="font-mono text-blue-300">
                    {totalPg.toFixed(2)} PG
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No filled containers to summarize.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
