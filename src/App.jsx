import React from "react";
import AuthScreen from "./AuthScreen";
import { useAuth } from "./hooks/useAuth";
import AuthRedirect from "./routes/AuthRedirect";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/views/DashboardView";
import InventoryView from "./components/views/InventoryView";
import FermentationView from "./components/views/FermentationView";
import DistillationView from "./components/views/DistillationView";
import TransactionsView from "./components/views/TransactionView";
import ProductTypeView from "./components/views/ProductTypeView";
import ContainerTypeView from "./components/views/ContainerTypeView";
import FermentersView from "./components/views/FermenterView";
const ReportsView = () => (
  <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
    <p className="text-gray-400">Reports view coming soon...</p>
  </div>
);

// const FermentersView = () => (
//   <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
//     <p className="text-gray-400">Fermenters view coming soon...</p>
//   </div>
// );


// Layout component for authenticated pages
function AuthenticatedLayout({ children }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <Header user={user} onLogout={logout} />

        {/* Page Content */}
        <main className="p-6 pt-20">
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
      {/* <Route path="/inventory/products" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ProductsView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } /> */}
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

      <Route path="/settings/producttype" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ProductTypeView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings/containertype" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ContainerTypeView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings/fermenters" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FermentersView />
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
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;