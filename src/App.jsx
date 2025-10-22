import React, { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import AuthScreen from "./AuthScreen";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import InventoryView from "./components/InventoryView";
import ProductsView from "./components/ProductsView";
import ProductionViewUpdated from "./components/ProductionViewUpdated";

// Main App Content Component
function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory-containers':
        return <InventoryView />;
      case 'inventory-products':
        return <ProductsView />;
      case 'production':
        return <ProductionViewUpdated />;
      case 'transfers':
        return (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <p className="text-gray-400">Transfers view coming soon...</p>
          </div>
        );
      case 'transactions':
        return (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <p className="text-gray-400">Transactions view coming soon...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <p className="text-gray-400">Reports view coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <p className="text-gray-400">Settings view coming soon...</p>
          </div>
        );
      default:
        return <DashboardView />;
    }
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <Header user={user} onLogout={logout} currentView={currentView} />

        {/* Page Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;