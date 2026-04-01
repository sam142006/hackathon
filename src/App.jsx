import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';

function App() {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route 
        path="/candidate" 
        element={
          token && userRole === 'CANDIDATE' ? 
          <CandidateDashboard /> : 
          <Navigate to="/" replace />
        } 
      />
      <Route 
        path="/recruiter" 
        element={
          token && userRole === 'RECRUITER' ? 
          <RecruiterDashboard /> : 
          <Navigate to="/" replace />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;