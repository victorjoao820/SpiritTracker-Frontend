import React from 'react';
import { useLocation } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const location = useLocation();
  
  const getViewTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/inventory/containers': 'Inventory - Containers',
      '/inventory/products': 'Inventory - Products',
      '/production': 'Production Batches',
      '/transfers': 'Spirit Transfers',
      '/transactions': 'Transaction History',
      '/reports': 'Reports & Analytics',
      '/settings': 'Settings',
    };
    return titles[location.pathname] || 'Spirit Tracker';
  };

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{getViewTitle()}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-300">
          <span className="text-gray-400">Logged in as:</span>{' '}
          <span className="font-medium">{user?.email}</span>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

