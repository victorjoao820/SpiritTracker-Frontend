import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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

const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();
  
  // Auto-expand inventory menu when on inventory pages
  React.useEffect(() => {
    if (location.pathname.startsWith('/inventory')) {
      setExpandedMenus(prev => ({ ...prev, inventory: true }));
    }
  }, [location.pathname]);
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: CubeIcon,
      submenu: [
        { id: 'inventory-containers', label: 'Containers', path: '/inventory/containers' },
        { id: 'inventory-products', label: 'Products', path: '/inventory/products' }
      ]
    },
    { id: 'production', label: 'Production', icon: BeakerIcon,
      submenu:[
        { id: 'production-fermentation', label: 'Fermentation', path: '/production/fermentation' },
        { id: 'production-distillation', label: 'Distillation', path: '/production/distillation' },
      ] 
    },
    // { id: 'transfers', label: 'Transfers', icon: ArrowsRightLeftIcon, path: '/transfers' },
    { id: 'transactions', label: 'Transactions', icon: ChartBarIcon, path: '/transactions' },
    { id: 'reports', label: 'Reports', icon: DocumentTextIcon, path: '/reports' },
    { id: 'settings', label: 'Settings', icon: CogIcon, path: '/settings' },
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
    return submenuItems.some(item => location.pathname === item.path);
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
            const isSubmenuActive = hasSubmenu && item.submenu.some(subItem => location.pathname === subItem.path);
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
                        {item.submenu.map((subItem) => (
                          <li key={subItem.id}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) =>
                                `w-full flex items-center px-4 py-2 rounded-lg transition-colors text-sm ${
                                  isActive
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`
                              }
                            >
                              <span>{subItem.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  /* Regular menu item without submenu */
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
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

