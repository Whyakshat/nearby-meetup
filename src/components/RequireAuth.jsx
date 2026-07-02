import React from 'react';
import { Navigate, useLocation as useRouteLocation } from 'react-router-dom';
import { useAppContext } from '../AppContext';

export const RequireAuth = ({ children }) => {
  const { currentUser } = useAppContext();
  const location = useRouteLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
