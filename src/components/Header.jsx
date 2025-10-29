import React from 'react';
import { useLocation } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';
import { UserRoundCheck , UserRoundX } from 'lucide-react';
import { LuLogOut } from "react-icons/lu";

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
      className="fixed top-0 left-64 right-0 h-16 border-b flex items-center justify-between px-6 transition-colors z-100 backdrop-blur-xs"
      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
    >
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{getViewTitle()}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeSwitcher />
        <div className="text-sm relative group" style={{ color: user ? 'var(--bg-logged-in)' : 'var(--bg-logged-out)' }}>
          {
            user ? (
              <UserRoundCheck size={20}/>
            ) : (
              <UserRoundX size={20}/>
            )
          }
            {/* <span>Proof Down</span> */}
         {/* <span>Proof Down</span> */}
         <span className="absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-opacity-100 rounded  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 top-full mb-2">
            {user? user.email : "No User"}
          </span>
          {/* <span className="font-medium">{user?.email}</span> */}
        </div>
        <button
          onClick={onLogout}
          className="relative inline-block group"
        >
          <LuLogOut size={20}/>
          <span className="absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-opacity-100 rounded  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 top-full mb-2">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;

