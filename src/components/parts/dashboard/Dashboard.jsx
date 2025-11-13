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
      if (c.status === "FILLED" && Number(c.netWeight) > 0) {
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
    <div className="p-4 rounded-lg mt-4 border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg text-center transition-colors hover:scale-105" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Total Proof Gallons</p>
          <p className="text-3xl font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
            {stats.totalProofGallons.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-lg text-center transition-colors hover:scale-105" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Total Wine Gallons</p>
          <p className="text-3xl font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
            {stats.totalWineGallons.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-lg text-center transition-colors hover:scale-105" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Total Weight Lbs</p>
          <p className="text-3xl font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>{stats.totalWeightLbs.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg text-center transition-colors hover:scale-105" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Empty Containers</p>
          <p className="text-3xl font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>{stats.emptyCount}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t transition-colors" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-2 transition-colors" style={{ color: 'var(--text-secondary)' }}>
          Inventory by Product (PG)
        </h3>
        <div className="p-4 rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          {stats.sortedProducts.length > 0 ? (
            <ul className="space-y-2">
              {stats.sortedProducts.map(([product, totalPg]) => (
                <li
                  key={product}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="transition-colors" style={{ color: 'var(--text-primary)' }}>{product}</span>
                  <span className="font-mono transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    {totalPg.toFixed(2)} PG
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
              No filled containers to summarize.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
