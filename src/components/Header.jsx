import React from 'react';
import { useLocation } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';

const Header = ({ user, onLogout }) => {
  const location = useLocation();
  
  const getViewTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/inventory/containers': 'Product Management',
      '/inventory/products': 'Product Type',
      '/transactions': 'Transaction History',
      '/reports': 'Reports & Analytics',
      '/settings': 'Settings',
    };
    return titles[location.pathname] || 'Spirit Tracker';
  };

  return (
    <header 
      className="h-16 border-b flex items-center justify-between px-6 transition-colors"
      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
    >
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{getViewTitle()}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeSwitcher />
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Logged in as:</span>{' '}
          <span className="font-medium">{user?.email}</span>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

