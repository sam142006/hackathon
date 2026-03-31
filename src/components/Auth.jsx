import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBriefcase, FaGraduationCap, FaArrowLeft, FaSpinner } from 'react-icons/fa';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupData, setSignupData] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleLoginClick = () => {
    setIsLogin(false);
    setError('');
    setShowOtpPage(false);
  };

  const handleSignupClick = () => {
    setIsLogin(true);
    setError('');
    setShowOtpPage(false);
  };

const handleSignupSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const response = await fetch('https://smarthire-hack.onrender.com/api/auth/signup', {
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
    
    const text = await response.text();
let data;

try {
  data = JSON.parse(text);
} catch {
  data = { message: text };
}
    
    if (!response.ok) {
     
      if (data.message && (data.message.includes('already registered') || data.message.includes('already exists'))) {
        console.log('Email already registered, showing OTP page');
        
       
        setSignupData({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          userType: role.toUpperCase()
        });
        
        setShowOtpPage(true);
        setResendTimer(30);
        setError(''); 
        
       
        setTimeout(() => {
          setError('Please verify OTP sent to your email to complete registration');
          setTimeout(() => setError(''), 3000);
        }, 500);
        
        return;
      }
      throw new Error(data.message || 'Signup failed');
    }
    
    console.log('Signup successful:', data);
    
    
    setSignupData({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      userType: role.toUpperCase()
    });
    
    setShowOtpPage(true);
    setResendTimer(30);
    setError('');
    
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
      const response = await fetch('https://smarthire-hack.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
          otp: otp
        })
      });
      
      const text = await response.text();
let data;

try {
  data = JSON.parse(text);
} catch {
  data = { message: text };
}
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }
      
      console.log('OTP verified:', data);
      
      setError('OTP verified successfully! Redirecting...');
      
     
      setTimeout(async () => {
        try {
          const loginResponse = await fetch('https://smarthire-hack.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: signupData.email,
              password: signupData.password
            })
          });
          
          const loginData = await loginResponse.json();
          
          if (!loginResponse.ok) {
            throw new Error(loginData.message || 'Auto-login failed');
          }
          
         
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('userId', loginData.userId);
          localStorage.setItem('userRole', loginData.role);
          localStorage.setItem('userName', loginData.name);
          localStorage.setItem('userEmail', loginData.email);
          
         
          if (loginData.role === 'RECRUITER') {
            navigate('/recruiter');
          } else {
            navigate('/candidate');
          }
          
        } catch (err) {
          setError('Auto-login failed. Please login manually.');
          setTimeout(() => {
            setIsLogin(false);
            setShowOtpPage(false);
          }, 2000);
        }
      }, 1500);
      
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
      console.error('OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleResendOtp = async () => {
    if (resendTimer > 0) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://smarthire-hack.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          userType: signupData.userType
        })
      });
      
    const text = await response.text();
let data;

try {
  data = JSON.parse(text);
} catch {
  data = { message: text };
}
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      setResendTimer(30);
      setError('OTP resent successfully! Check your email.');
      
      setTimeout(() => {
        setError('');
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

const handleLoginSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const response = await fetch('https://smarthire-hack.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword
      })
    });
    
  const text = await response.text();
let data;

try {
  data = JSON.parse(text);
} catch {
  data = { message: text };
}
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    console.log('Login successful:', data);
    console.log('Role from API:', data.role);
    
   
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userEmail', data.email);
    
   
    console.log('Stored userRole:', localStorage.getItem('userRole'));
    
   
    if (data.role === 'RECRUITER') {
      console.log('Navigating to /recruiter');
      navigate('/recruiter');
    } else if (data.role === 'CANDIDATE') {
      console.log('Navigating to /candidate');
      navigate('/candidate');
    } else {
      console.log('Unknown role, defaulting to candidate');
      navigate('/candidate');
    }
    
  } catch (err) {
    setError(err.message || 'Login failed. Please check your credentials.');
    console.error('Login error:', err);
  } finally {
    setLoading(false);
  }
};


  if (showOtpPage) {
    return (
      <div className="h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="p-8">
            <button
              onClick={() => {
                setShowOtpPage(false);
                setError('');
                setOtp('');
              }}
              className="mb-6 flex items-center gap-2 text-teal-500 hover:text-teal-700 transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back to Signup</span>
            </button>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FaEnvelope className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
              <p className="text-gray-600 text-sm">
                We've sent a verification code to
                <br />
                <span className="font-semibold text-teal-600">{signupData?.email}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Please check your inbox and spam folder
              </p>
            </div>
            
            {error && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                error.includes('successfully') || error.includes('Redirecting')
                  ? 'bg-green-100 text-green-700' 
                  : error.includes('resent')
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {loading && error.includes('Redirecting') ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    <span>{error}</span>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}
            
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                  required
                  disabled={loading}
                  maxLength="6"
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Didn't get the OTP?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className={`font-semibold ${
                      resendTimer > 0 || loading
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-teal-500 hover:text-teal-700'
                    } transition-colors`}
                  >
                    {resendTimer > 0 
                      ? `Resend in ${resendTimer}s` 
                      : 'Resend OTP'}
                  </button>
                </p>
              </div>
            </form>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">
                Didn't receive OTP? Check your spam folder or contact support
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
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
          isLogin ? 'left-0' : '-left-1/2'
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
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? 'SIGNING UP...' : 'SIGN UP'}
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
                className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? 'LOGGING IN...' : 'LOG IN'}
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