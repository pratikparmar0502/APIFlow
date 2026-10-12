import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkflowList } from './pages/WorkflowList';
import { WorkflowBuilder } from './pages/WorkflowBuilder';
import { RequestTester } from './pages/RequestTester';
import { ExecutionHistory } from './pages/ExecutionHistory';
import { ExecutionDetail } from './pages/ExecutionDetail';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/workflows" element={<WorkflowList />} />
        <Route path="/workflows/new" element={<WorkflowBuilder />} />
        <Route path="/workflows/:id/edit" element={<WorkflowBuilder />} />
        <Route path="/tester" element={<RequestTester />} />
        <Route path="/history" element={<ExecutionHistory />} />
        <Route path="/history/:id" element={<ExecutionDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default App;

