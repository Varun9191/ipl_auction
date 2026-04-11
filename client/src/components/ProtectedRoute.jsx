import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const { teamId } = useParams();
  const auth = JSON.parse(localStorage.getItem('ipl_auction_auth') || 'null');

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin' && auth.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  if (role === 'team') {
    if (auth.role !== 'team' || (teamId && auth.teamId !== teamId)) {
        // If logged in as admin, allowed to view team dashboard
        if (auth.role === 'admin') return children;
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}
