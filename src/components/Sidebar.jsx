import React, { useState } from 'react';
import { 
  HomeIcon, 
  CubeIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from './icons/NavigationIcons';

const Sidebar = ({ currentView, onViewChange }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: CubeIcon,
      submenu: [
        { id: 'inventory-containers', label: 'Containers' },
        { id: 'inventory-products', label: 'Products' }
      ]
    },
    { id: 'production', label: 'Production', icon: BeakerIcon },
    { id: 'transfers', label: 'Transfers', icon: ArrowsRightLeftIcon },
    { id: 'transactions', label: 'Transactions', icon: ChartBarIcon },
    { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const isMenuExpanded = (menuId) => {
    return expandedMenus[menuId] || false;
  };

  const isSubmenuActive = (submenuItems) => {
    return submenuItems.some(item => currentView === item.id);
  };

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
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isActive = currentView === item.id;
            const isSubmenuActive = hasSubmenu && item.submenu.some(subItem => currentView === subItem.id);
            const isExpanded = isMenuExpanded(item.id);
            
            return (
              <li key={item.id}>
                {hasSubmenu ? (
                  <>
                    {/* Main menu item with submenu */}
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        isSubmenuActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Submenu items */}
                    {isExpanded && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubItemActive = currentView === subItem.id;
                          return (
                            <li key={subItem.id}>
                              <button
                                onClick={() => onViewChange(subItem.id)}
                                className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors text-sm ${
                                  isSubItemActive
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                              >
                                <span>{subItem.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  /* Regular menu item without submenu */
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
                )}
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

