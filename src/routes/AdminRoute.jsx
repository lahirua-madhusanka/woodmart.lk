import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted">Checking permissions...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
