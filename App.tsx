
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExpenseManager from './pages/ExpenseManager';
import ExpenseOverview from './pages/ExpenseOverview';
import AccountManager from './pages/AccountManager';
import CategoryManager from './pages/CategoryManager';
import BudgetManager from './pages/BudgetManager';
import CreditCardManager from './pages/CreditCardManager';
import SplitDashboard from './pages/splitwise/SplitDashboard';
import PeopleManager from './pages/splitwise/PeopleManager';
import GroupDetail from './pages/splitwise/GroupDetail';
import GroupsManager from './pages/splitwise/GroupsManager';
import Login from './pages/Login';
import TodoApp from './pages/todo/TodoApp';
import PlannedExpensesApp from './pages/planned/PlannedExpensesApp';
import CsvImportPage from './pages/CsvImportPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import GiaImprovedUX from './pages/Gia';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/gia" element={<GiaImprovedUX />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
             path="/expenses/import" 
             element={
               <ProtectedRoute>
                 <CsvImportPage />
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
             path="/expenses/overview" 
             element={
               <ProtectedRoute>
                 <Layout><ExpenseOverview /></Layout>
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
          <Route 
            path="/budget" 
            element={
              <ProtectedRoute>
                <Layout><BudgetManager /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/credit-cards" 
            element={
              <ProtectedRoute>
                <Layout><CreditCardManager /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
             path="/splitwise" 
             element={
               <ProtectedRoute>
                 <Layout><SplitDashboard /></Layout>
               </ProtectedRoute>
             } 
          />
          <Route 
             path="/todo" 
             element={
               <ProtectedRoute>
                 <Layout><TodoApp /></Layout>
               </ProtectedRoute>
             } 
          />
          <Route 
             path="/todo/list" 
             element={
               <ProtectedRoute>
                 <Layout><TodoApp /></Layout>
               </ProtectedRoute>
             } 
          />
          <Route 
             path="/planned" 
             element={
               <ProtectedRoute>
                 <Layout><PlannedExpensesApp /></Layout>
               </ProtectedRoute>
             } 
          />





          <Route 
             path="/splitwise/groups" 
             element={
               <ProtectedRoute>
                 <Layout><GroupsManager /></Layout>
               </ProtectedRoute>
             } 
          />
          <Route 
             path="/splitwise/people" 
             element={
               <ProtectedRoute>
                 <Layout><PeopleManager /></Layout>
               </ProtectedRoute>
             } 
          />
           <Route 
             path="/splitwise/group/:id" 
             element={
               <ProtectedRoute>
                 <Layout><GroupDetail /></Layout>
               </ProtectedRoute>
             } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
