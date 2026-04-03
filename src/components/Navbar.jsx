import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { clearSession } from '../utils/auth';
import BrandLogo from './BrandLogo';

const Navbar = ({ title }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg rounded-2xl mb-8">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BrandLogo subtitle={title} />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FaUserCircle className="text-2xl text-teal-500" />
              <span className="text-gray-700 font-medium">{userName}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
