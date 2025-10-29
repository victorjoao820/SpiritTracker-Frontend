import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
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
    { id: 'transactions', label: 'Transactions', icon: ChartBarIcon, path: '/transactions' },
    { id: 'reports', label: 'Reports', icon: DocumentTextIcon, path: '/reports' },
    { id: 'settings', label: 'Settings', icon: CogIcon, path: '/settings' },
  ];

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => {
      // If clicking the same menu, toggle it
      if (prev[menuId]) {
        return { ...prev, [menuId]: false };
      }
      // Otherwise, close all other menus and open this one
      return { [menuId]: true };
    });
  };

  const isMenuExpanded = (menuId) => {
    return expandedMenus[menuId] || false;
  };

  const isSubmenuActive = (submenuItems) => {
    return submenuItems.some(item => location.pathname === item.path);
  };

  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-64 z-9999 border-r flex flex-col transition-colors backdrop-blur-xs"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Logo/Brand */}
      <div 
        className="h-16 flex items-center justify-center border-b transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {/* <h1 className="text-xl font-bold transition-colors" style={{ color: 'var(--text-secondary)' }}>Spirit Trackers</h1> */}
        <img src="/src/assets/title.png" alt="Spirit Trackers" className="h-10" />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuActive = hasSubmenu && item.submenu.some(subItem => location.pathname === subItem.path);
            const isExpanded = isMenuExpanded(item.id);
            
            // For items with submenus, check if we're on any page that starts with their base path
            const isParentActive = hasSubmenu && (
              (item.id === 'inventory' && location.pathname.startsWith('/inventory')) ||
              (item.id === 'production' && location.pathname.startsWith('/production'))
            );
            
            // Highlight when on parent's pages OR when the parent menu is expanded
            const shouldHighlightParent = isParentActive || (hasSubmenu && isExpanded);
            
            return (
              <li key={item.id}>
                {hasSubmenu ? (
                  <>
                    {/* Main menu item with submenu */}
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-[2vw] transition-all ${
                        shouldHighlightParent ? 'bg-accent shadow-md' : ''
                      }`}
                      style={{
                        color: shouldHighlightParent ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                        backgroundColor: shouldHighlightParent ? 'var(--bg-accent)' : '',
                        borderColor: shouldHighlightParent ? 'var(--border-color)' : '',
                      }}
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
                                `w-full flex items-center px-4 py-2 rounded-[2vw] transition-all text-sm ${
                                  isActive ? 'bg-accent shadow-sm' : ''
                                }`
                              }
                              style={({ isActive }) => ({
                                backgroundColor: isActive ? 'var(--bg-accent)' : '',
                                color: isActive ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                                borderColor: isActive ? 'var(--border-color)' : '',
                              })}
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
                    onClick={() => setExpandedMenus({})}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-3 px-4 py-3 rounded-[2vw] transition-all ${
                        isActive ? 'bg-accent shadow-md' : ''
                      }`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'var(--bg-accent)' : '',
                      color: isActive ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                      borderColor: isActive ? 'var(--border-color)' : '',
                    })}
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
      <div 
        className="p-4 border-t transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <p className="text-xs text-center transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          Spirit Tracker v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

