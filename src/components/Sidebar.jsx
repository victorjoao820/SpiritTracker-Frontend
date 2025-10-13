import React from 'react';
import { 
  HomeIcon, 
  CubeIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  CogIcon
} from './icons/NavigationIcons';

const Sidebar = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'inventory', label: 'Inventory', icon: CubeIcon },
    { id: 'production', label: 'Production', icon: BeakerIcon },
    { id: 'transfers', label: 'Transfers', icon: ArrowsRightLeftIcon },
    { id: 'transactions', label: 'Transactions', icon: ChartBarIcon },
    { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Spirit Tracker</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Spirit Tracker v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

