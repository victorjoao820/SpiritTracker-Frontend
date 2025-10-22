import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AuthRedirectProps {
  children: React.ReactNode;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  
  // If user is authenticated, redirect to homepage
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // If not authenticated, show the auth page
  return <>{children}</>;
};

export default AuthRedirect;
