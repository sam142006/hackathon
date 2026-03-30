import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';

function App() {
  const userRole = localStorage.getItem('userRole');

  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route 
        path="/recruiter" 
        element={userRole === 'recruiter' ? <RecruiterDashboard /> : <Navigate to="/" />} 
      />
      <Route 
        path="/candidate" 
        element={userRole === 'candidate' ? <CandidateDashboard /> : <Navigate to="/" />} 
      />
    </Routes>
  );
}

export default App;