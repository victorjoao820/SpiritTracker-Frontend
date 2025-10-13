import React, { useState, useEffect } from 'react';
import { usersAPI, containersAPI, productionAPI, transactionsAPI } from '../services/api';

const DashboardView = () => {
  const [stats, setStats] = useState({
    totalContainers: 0,
    filledContainers: 0,
    emptyContainers: 0,
    totalProduction: 0,
    totalVolume: 0,
    recentTransactions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [containers, production, transactions] = await Promise.all([
          containersAPI.getAll(),
          productionAPI.getAll(),
          transactionsAPI.getAll({ limit: 5 })
        ]);

        const filledCount = containers.filter(c => !c.isEmpty).length;
        const totalVol = containers.reduce((sum, c) => sum + Number(c.currentVolumeGallons || 0), 0);

        setStats({
          totalContainers: containers.length,
          filledContainers: filledCount,
          emptyContainers: containers.length - filledCount,
          totalProduction: production.length,
          totalVolume: totalVol,
          recentTransactions: transactions.transactions || transactions || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Containers"
          value={stats.totalContainers}
          icon="📦"
          color="bg-blue-600"
        />
        <StatCard
          title="Filled Containers"
          value={stats.filledContainers}
          icon="✅"
          color="bg-green-600"
        />
        <StatCard
          title="Empty Containers"
          value={stats.emptyContainers}
          icon="⬜"
          color="bg-gray-600"
        />
        <StatCard
          title="Production Batches"
          value={stats.totalProduction}
          icon="🏭"
          color="bg-purple-600"
        />
      </div>

      {/* Volume Stats */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Total Volume</h3>
        <div className="text-3xl font-bold text-blue-400">
          {stats.totalVolume.toFixed(2)} gallons
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
        {stats.recentTransactions.length === 0 ? (
          <p className="text-gray-400">No recent transactions</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-white">{transaction.transactionType}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {transaction.volumeGallons && (
                    <p className="font-medium text-blue-400">
                      {Number(transaction.volumeGallons).toFixed(2)} gal
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

