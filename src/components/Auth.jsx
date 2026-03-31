import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBriefcase, FaGraduationCap } from 'react-icons/fa';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupData, setSignupData] = useState(null);
  const navigate = useNavigate();

 
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLoginClick = () => {
    setIsLogin(false);
    setError('');
    setOtpSent(false);
  };

  const handleSignupClick = () => {
    setIsLogin(true);
    setError('');
    setOtpSent(false);
  };

 
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://smarthire-hack.onrender.com:8082/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          userType: role.toUpperCase() 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      console.log('Signup successful:', data);
      
   
      setSignupData({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        userType: role.toUpperCase()
      });
      
      setOtpSent(true);
      setError('OTP sent to your email. Please verify to complete signup.');
      
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8082/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
          otp: otp
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      console.log('OTP verified:', data);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      
     
      if (data.role === 'RECRUITER') {
        navigate('/recruiter');
      } else {
        navigate('/candidate');
      }
      
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
      console.error('OTP error:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8082/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      
      console.log('Login successful:', data);
      
      
      if (data.role === 'RECRUITER') {
        navigate('/recruiter');
      } else {
        navigate('/candidate');
      }
      
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-8">
      <div className="relative w-full max-w-4xl h-[550px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        
       
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-md text-center">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-3 text-white hover:text-gray-200 font-bold"
            >
              ×
            </button>
          </div>
        )}
        
        
        <div className={`absolute top-0 w-1/2 h-full transition-all duration-500 ease-in-out ${
          isLogin && !otpSent ? 'left-0' : '-left-1/2'
        }`}>
          <div className="w-full h-full bg-white px-8 py-6 flex flex-col justify-center overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Create Account</h2>
            
          
            <div className="mb-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                    role === 'candidate' 
                      ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'SIGNING UP...' : 'SIGN UP'}
              </button>
            </form>
          </div>
        </div>

       
        <div className={`absolute top-0 w-1/2 h-full transition-all duration-500 ease-in-out ${
          isLogin && otpSent ? 'left-0' : '-left-1/2'
        }`}>
          <div className="w-full h-full bg-white px-8 py-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Verify OTP</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Please enter the OTP sent to your email
            </p>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 text-sm" />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setError('');
                }}
                className="w-full text-sm text-teal-500 hover:text-teal-700 text-center"
              >
                Back to Signup
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              <div className="text-right">
                <a href="#" className="text-xs text-teal-500 hover:text-teal-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'LOGGING IN...' : 'LOG IN'}
              </button>
            </form>
          </div>
        </div>

     
        <div className={`absolute top-0 w-1/2 h-full bg-gradient-to-br from-teal-600 to-green-700 text-white transition-all duration-500 ease-in-out z-10 ${
          isLogin && !otpSent ? 'left-1/2' : 'left-0'
        }`}>
          <div className="w-full h-full flex flex-col justify-center items-center px-8 py-6 text-center">
            {isLogin && !otpSent ? (
              <>
                <h2 className="text-3xl font-bold mb-3">Welcome Back!</h2>
                <p className="text-teal-100 text-sm mb-6">
                  To keep connected with us, please log in with your personal info.
                </p>
                <button
                  onClick={handleLoginClick}
                  disabled={loading}
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
                  disabled={loading}
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