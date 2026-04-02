import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearSession, getStoredToken, resolveSession } from '../utils/auth';

const ProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    loading: true,
    authorized: false,
  });

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const token = getStoredToken();

      if (!token) {
        if (isMounted) {
          setAuthState({ loading: false, authorized: false });
        }
        return;
      }

      const session = await resolveSession(token);
      const isAllowed = Boolean(session && allowedRoles.includes(session.role));

      if (!isAllowed) {
        clearSession();
      }

      if (isMounted) {
        setAuthState({
          loading: false,
          authorized: isAllowed,
        });
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles]);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-green-50">
        <p className="text-sm font-medium text-teal-700">Checking your session...</p>
      </div>
    );
  }

  if (!authState.authorized) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;