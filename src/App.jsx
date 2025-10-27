import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import AuthScreen from "./AuthScreen";
import ProtectedRoute from "./routes/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/views/DashboardView";
import InventoryView from "./components/views/InventoryView";
import ProductsView from "./components/views/ProductsView";
import FermentationView from "./components/views/FermentationView";

import AuthRedirect from "./routes/AuthRedirect";
import DistillationView from "./components/views/DistillationView";

// Placeholder components for routes that aren't implemented yet
const TransfersView = () => (
  <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
    <p className="text-gray-400">Transfers view coming soon...</p>
  </div>
);

const TransactionsView = () => (
  <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
    <p className="text-gray-400">Transactions view coming soon...</p>
  </div>
);

const ReportsView = () => (
  <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
    <p className="text-gray-400">Reports view coming soon...</p>
  </div>
);

const SettingsView = () => (
  <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
    <p className="text-gray-400">Settings view coming soon...</p>
  </div>
);

// Layout component for authenticated pages
function AuthenticatedLayout({ children }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 bg-gray-900">
        {/* Header */}
        <Header user={user} onLogout={logout} />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Main App Content Component
function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />      
      <Route path="/login" element={
        <AuthRedirect>
          <AuthScreen />
        </AuthRedirect>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DashboardView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/inventory/containers" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <InventoryView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/inventory/products" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ProductsView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/production/fermentation" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FermentationView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/production/distillation" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DistillationView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      {/* <Route path="/transfers" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <TransfersView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } /> */}
      <Route path="/transactions" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <TransactionsView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ReportsView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <SettingsView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main App Component with Auth Provider and Router
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;