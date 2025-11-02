import React, { useState, useEffect } from 'react';
import { containersAPI, transactionsAPI, fermentationAPI, distillationAPI } from '../../services/api';
import { Dashboard } from '../parts/dashboard/Dashboard';

import { GiCubeforce, GiCube, } from "react-icons/gi";
import { BiCylinder } from "react-icons/bi";

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
          fermentationAPI.getAll(),
          distillationAPI.getAll(),
          transactionsAPI.getAll({ limit: 5 })
        ]);

        const filledCount = containers.filter(c => c.status === 'FILLED').length;
        const totalVol = containers.reduce((sum, c) => sum + Number(c.netWeight || 0), 0);
        // const totalProofGallons = 

        setStats({
          containers: containers,
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
        <div className="text-gray-400 dark:text-gray-500">Loading dashboard...</div>
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
          icon={<GiCubeforce />}
          color="bg-orange-500"
        />
        <StatCard
          title="Filled Containers"
          value={stats.filledContainers}
          icon={<GiCube s />}
          color="bg-blue-500"
        />
        <StatCard
          title="Empty Containers"
          value={stats.emptyContainers}
          icon={<BiCylinder />}
          color="bg-cyan-600 "
        />
        <StatCard
          title="Production Batches"
          value={stats.totalProduction}
          icon="🏭"
          color=" bg-emerald-600"
        />
      </div>

      <Dashboard inventory={stats.containers}

      />

      {/* Recent Transactions */}
      <div className="rounded-lg p-6 border transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4 transition-colors" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
        {stats.recentTransactions.length === 0 ? (
          <p className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>No recent transactions</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--bg-card-hover)' }}
              >
                <div>
                  <p className="font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>{transaction.transactionType}</p>
                  <p className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {transaction.volumeGallons && (
                    <p className="font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
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
    <div className={`${color} p-6 rounded-lg flex flex-col items-center justify-center space-y-3 text-white text-center transition-transform hover:scale-105 `}
      style={{ transition: 'all 0.3s ease', boxShadow: '0 8px 32px rgba(214, 23, 23, 0.2)', backdropFilter: 'blur(10px)', borderColor: 'var(--border-color)' }}>
      <div className="text-4xl">
        {icon}
      </div>
      <span className="text-2xl font-bold">{title}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
};

export default DashboardView;

