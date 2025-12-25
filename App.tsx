
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExpenseManager from './pages/ExpenseManager';
import AccountManager from './pages/AccountManager';
import CategoryManager from './pages/CategoryManager';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <Layout><ExpenseManager /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts" 
            element={
              <ProtectedRoute>
                <Layout><AccountManager /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute>
                <Layout><CategoryManager /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
