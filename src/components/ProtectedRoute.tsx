import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const roleRoutes: Record<string, string> = {
      farmer: '/farmer',
      buyer: '/buyer',
      transporter: '/transporter',
      storage: '/storage',
      admin: '/admin',
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return <>{children}</>;
}
