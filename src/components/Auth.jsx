import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBriefcase, FaGraduationCap } from 'react-icons/fa';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('candidate');
  const navigate = useNavigate();

  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLoginClick = () => {
    setIsLogin(false);
  };

  const handleSignupClick = () => {
    setIsLogin(true);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    console.log('Signup submitted with role:', role);
    
   
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', signupName);
    localStorage.setItem('userEmail', signupEmail);
    
    console.log('Stored in localStorage:', {
      userRole: localStorage.getItem('userRole'),
      userName: localStorage.getItem('userName'),
      userEmail: localStorage.getItem('userEmail')
    });
    
    
    if (role === 'recruiter') {
      console.log('Navigating to /recruiter');
      navigate('/recruiter');
    } else {
      console.log('Navigating to /candidate');
      navigate('/candidate');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted');
    
    
    const storedRole = localStorage.getItem('userRole');
    console.log('Stored role from localStorage:', storedRole);
    
    const finalRole = storedRole || role;
    localStorage.setItem('userRole', finalRole);
    
    console.log('Final role for navigation:', finalRole);
    
  
    if (finalRole === 'recruiter') {
      console.log('Navigating to /recruiter');
      navigate('/recruiter');
    } else {
      console.log('Navigating to /candidate');
      navigate('/candidate');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-8">
      <div className="relative w-full max-w-4xl h-[550px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        
     
        <div className={`absolute top-0 w-1/2 h-full transition-all duration-500 ease-in-out ${
          isLogin ? 'left-0' : '-left-1/2'
        }`}>
          <div className="w-full h-full bg-white px-8 py-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Create Account</h2>
            
           
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                    role === 'candidate' 
                      ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FaGraduationCap />
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                    role === 'recruiter' 
                      ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FaBriefcase />
                  Recruiter
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 text-sm" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 text-sm" />
                <input
                  type="email"
                  placeholder="Email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 text-sm" />
                <input
                  type="password"
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm"
              >
                SIGN UP
              </button>
            </form>
          </div>
        </div>

        <div className={`absolute top-0 w-1/2 h-full transition-all duration-500 ease-in-out ${
          !isLogin ? 'right-0' : '-right-1/2'
        }`}>
          <div className="w-full h-full bg-white px-8 py-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 text-center">Welcome Back</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 text-sm" />
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 text-sm" />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div className="text-right">
                <a href="#" className="text-xs text-teal-500 hover:text-teal-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm"
              >
                SIGN IN
              </button>
            </form>
          </div>
        </div>

       
        <div className={`absolute top-0 w-1/2 h-full bg-gradient-to-br from-teal-600 to-green-700 text-white transition-all duration-500 ease-in-out z-10 ${
          isLogin ? 'left-1/2' : 'left-0'
        }`}>
          <div className="w-full h-full flex flex-col justify-center items-center px-8 py-6 text-center">
            {isLogin ? (
              <>
                <h2 className="text-3xl font-bold mb-3">Welcome Back!</h2>
                <p className="text-teal-100 text-sm mb-6">
                  To keep connected with us, please log in with your personal info.
                </p>
                <button
                  onClick={handleLoginClick}
                  className="w-full max-w-xs py-2 px-4 border-2 border-white rounded-full font-semibold text-white hover:bg-white hover:text-teal-600 transition-all duration-300 transform hover:scale-105 text-sm"
                >
                  LOG IN
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-3">Hello, Friend!</h2>
                <p className="text-teal-100 text-sm mb-6">
                  Enter your personal details and start your journey with us.
                </p>
                <button
                  onClick={handleSignupClick}
                  className="w-full max-w-xs py-2 px-4 border-2 border-white rounded-full font-semibold text-white hover:bg-white hover:text-teal-600 transition-all duration-300 transform hover:scale-105 text-sm"
                >
                  SIGN UP
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;