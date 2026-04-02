import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import MockInterview from './pages/MockInterview';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />

      <Route element={<ProtectedRoute allowedRoles={['CANDIDATE']} />}>
        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
        <Route path="/mock-interview" element={<MockInterview />} />
        <Route path="/candidate" element={<Navigate to="/candidate-dashboard" replace />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter" element={<Navigate to="/recruiter-dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;